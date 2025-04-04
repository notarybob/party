import React, {
  useState,
  useImperativeHandle,
  ForwardRefRenderFunction,
  PropsWithChildren,
  useRef,
  useEffect,
} from 'react'
import classNames from 'classnames'
import Taro, {
  chooseImage,
  uploadFile,
  getEnv,
  chooseMedia,
} from '@tarojs/taro'
import { Failure, Photograph } from '@nutui/icons-react-taro'
import Button from '@/packages/button/index.taro'
import {
  ERROR,
  SUCCESS,
  UploaderTaro,
  UPLOADING,
  UploadOptions,
} from './upload'
import { useConfig } from '@/packages/configprovider/configprovider.taro'
import { funcInterceptor } from '@/utils/interceptor'
import { BasicComponent, ComponentDefaults } from '@/utils/typings'
import { FileItem } from './file-item'
import { usePropsValue } from '@/utils/use-props-value'
import { Preview } from '@/packages/uploader/preview.taro'

interface sizeType {
  /** 原图 */
  original: string
  /** compressed */
  compressed: string
}

interface sourceType {
  /** 从相册选图 */
  album: string
  /** 使用相机 */
  camera: string
}

interface mediaType {
  /** 只能拍摄图片或从相册选择图片 */
  image: string
  /** 只能拍摄视频或从相册选择视频 */
  video: string
}

interface TFileType {
  size: number
  type?: string
  fileType?: string
  originalFileObj?: any
  tempFilePath?: string
  thumbTempFilePath?: string
  path?: string
}

export interface UploaderProps extends BasicComponent {
  url: string
  maxCount: string | number
  sizeType: (keyof sizeType)[]
  sourceType: (keyof sourceType)[]
  mediaType: (keyof mediaType)[]
  camera: string
  maxFileSize: number
  defaultValue?: FileItem[]
  value?: FileItem[]
  previewType: 'picture' | 'list'
  fit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  uploadIcon?: React.ReactNode
  deleteIcon?: React.ReactNode
  uploadLabel?: React.ReactNode
  name: string
  accept: string
  disabled: boolean
  autoUpload: boolean
  multiple: boolean
  timeout: number
  data: any
  method: string
  xhrState: number | string
  headers: any
  preview: boolean
  deletable: boolean
  className: string
  previewUrl?: string
  maxDuration: number
  style: React.CSSProperties
  onStart?: (option: UploadOptions) => void
  onDelete?: (file: FileItem, files: FileItem[]) => void
  onSuccess?: (param: {
    responseText: XMLHttpRequest['responseText']
    option: UploadOptions
    files: FileItem[]
  }) => void
  onProgress?: (param: {
    e: ProgressEvent<XMLHttpRequestEventTarget>
    option: UploadOptions
    percentage: number | string
  }) => void
  onFailure?: (param: {
    responseText: XMLHttpRequest['responseText']
    option: UploadOptions
    files: FileItem[]
  }) => void
  onUpdate?: (files: FileItem[]) => void
  onOversize?: (
    files: Taro.chooseImage.ImageFile[] | Taro.chooseMedia.ChooseMedia[] | any
  ) => void
  onChange?: (files: FileItem[]) => void
  beforeUpload?: (
    files: Taro.chooseImage.ImageFile[] | Taro.chooseMedia.ChooseMedia[] | any
  ) => Promise<File[] | boolean>
  beforeXhrUpload?: (xhr: XMLHttpRequest, options: any) => void
  beforeDelete?: (file: FileItem, files: FileItem[]) => boolean
  onFileItemClick?: (file: FileItem, index: number) => void
}

const defaultProps = {
  ...ComponentDefaults,
  url: '',
  maxCount: 1,
  sizeType: ['original', 'compressed'],
  sourceType: ['album', 'camera'],
  mediaType: ['image', 'video'],
  camera: 'back',
  uploadIcon: <Photograph size="20px" color="#808080" />,
  deleteIcon: <Failure color="rgba(0,0,0,0.6)" />,
  uploadLabel: '',
  previewType: 'picture',
  fit: 'cover',
  name: 'file',
  accept: '*',
  disabled: false,
  autoUpload: true,
  multiple: false,
  maxFileSize: Number.MAX_VALUE,
  data: {},
  headers: {},
  method: 'post',
  previewUrl: '',
  xhrState: 200,
  timeout: 1000 * 30,
  preview: true,
  deletable: true,
  maxDuration: 10,
  beforeDelete: (file: FileItem, files: FileItem[]) => {
    return true
  },
} as UploaderProps

const InternalUploader: ForwardRefRenderFunction<
  unknown,
  PropsWithChildren<Partial<UploaderProps>>
> = (props, ref) => {
  const { locale } = useConfig()
  const {
    children,
    uploadIcon,
    deleteIcon,
    uploadLabel,
    accept,
    name,
    camera,
    defaultValue,
    value,
    previewType,
    fit,
    disabled,
    multiple,
    url,
    previewUrl,
    headers,
    timeout,
    method,
    xhrState,
    data,
    preview,
    deletable,
    maxCount,
    maxFileSize,
    mediaType,
    className,
    autoUpload,
    sizeType,
    sourceType,
    maxDuration,
    onStart,
    onDelete,
    onChange,
    onFileItemClick,
    onProgress,
    onSuccess,
    onUpdate,
    onFailure,
    onOversize,
    beforeUpload,
    beforeXhrUpload,
    beforeDelete,
    ...restProps
  } = { ...defaultProps, ...props }
  const [fileList, setFileList] = usePropsValue({
    value,
    defaultValue,
    finalValue: [],
    onChange: (v) => {
      onChange?.(v)
    },
  })
  const [uploadQueue, setUploadQueue] = useState<Promise<UploaderTaro>[]>([])

  const classes = classNames(className, 'nut-uploader')

  useImperativeHandle(ref, () => ({
    submit: () => {
      Promise.all(uploadQueue).then((res) => {
        res.forEach((i) => i.uploadTaro(uploadFile, getEnv()))
      })
    },
    clear: () => {
      clearUploadQueue()
    },
  }))
  const fileListRef = useRef<FileItem[]>([])
  useEffect(() => {
    fileListRef.current = fileList
  }, [fileList])
  const clearUploadQueue = (index = -1) => {
    if (index > -1) {
      uploadQueue.splice(index, 1)
      setUploadQueue(uploadQueue)
    } else {
      setUploadQueue([])
      setFileList([])
    }
  }

  const _chooseImage = () => {
    if (disabled) {
      return
    }
    if (Taro.getEnv() === 'WEB') {
      const el = document.getElementById('taroChooseImage')
      if (el) {
        el?.setAttribute('accept', accept)
      } else {
        const obj = document.createElement('input')
        obj.setAttribute('type', 'file')
        obj.setAttribute('id', 'taroChooseImage')
        obj.setAttribute('accept', accept)
        obj.setAttribute(
          'style',
          'position: fixed; top: -4000px; left: -3000px; z-index: -300;'
        )
        document.body.appendChild(obj)
      }
    }
    if (['WEAPP', 'JD', 'WEB'].includes(getEnv()) && chooseMedia) {
      // 其余端全部使用 chooseImage API
      chooseMedia({
        count: multiple ? (maxCount as number) * 1 - fileList.length : 1,
        /** 文件类型 */
        mediaType: mediaType as any,
        /** 图片和视频选择的来源 */
        sourceType,
        /** 拍摄视频最长拍摄时间，单位秒。时间范围为 3s 至 30s 之间 */
        maxDuration,
        /** 仅对 mediaType 为 image 时有效，是否压缩所选文件 */
        sizeType,
        /** 仅在 sourceType 为 camera 时生效，使用前置或后置摄像头 */
        camera,
        fail: (res: any) => {
          onFailure && onFailure(res)
        },
        success: onChangeMedia,
      })
    } else {
      chooseImage({
        count: multiple ? (maxCount as number) * 1 - fileList.length : 1,
        // 可以指定是原图还是压缩图，默认二者都有
        sizeType,
        sourceType,
        success: onChangeImage,
        fail: (res: any) => {
          onFailure && onFailure(res)
        },
      })
    }
  }

  const executeUpload = (fileItem: FileItem, index: number) => {
    const uploadOption = new UploadOptions()
    uploadOption.name = name
    uploadOption.url = url
    uploadOption.fileType = fileItem.type
    uploadOption.formData = fileItem.formData
    uploadOption.timeout = timeout * 1
    uploadOption.method = method
    uploadOption.xhrState = xhrState
    uploadOption.headers = headers
    uploadOption.taroFilePath = fileItem.path
    uploadOption.beforeXhrUpload = beforeXhrUpload
    uploadOption.onStart = (option: UploadOptions) => {
      clearUploadQueue(index)
      setFileList(
        fileListRef.current.map((item) => {
          if (item.uid === fileItem.uid) {
            item.status = 'ready'
            item.message = locale.uploader.readyUpload
          }
          return item
        })
      )
      onStart?.(option)
    }

    uploadOption.onProgress = (e: any, option: UploadOptions) => {
      setFileList(
        fileListRef.current.map((item) => {
          if (item.uid === fileItem.uid) {
            item.status = UPLOADING
            item.message = locale.uploader.uploading
            item.percentage = e.progress
            onProgress?.({ e, option, percentage: item.percentage as number })
          }
          return item
        })
      )
    }

    uploadOption.onSuccess = (
      responseText: XMLHttpRequest['responseText'],
      option: UploadOptions
    ) => {
      const list = fileListRef.current.map((item) => {
        if (item.uid === fileItem.uid) {
          item.status = SUCCESS
          item.message = locale.uploader.success
          item.responseText = responseText
        }
        return item
      })
      setFileList(list)
      onSuccess?.({
        responseText,
        option,
        files: list,
      })
    }

    uploadOption.onFailure = (
      responseText: XMLHttpRequest['responseText'],
      option: UploadOptions
    ) => {
      const list = fileListRef.current.map((item) => {
        if (item.uid === fileItem.uid) {
          item.status = ERROR
          item.message = locale.uploader.error
          item.responseText = responseText
        }
        return item
      })
      setFileList(list)
      onFailure?.({
        responseText,
        option,
        files: list,
      })
    }

    const task = new UploaderTaro(uploadOption)
    if (autoUpload) {
      task.uploadTaro(uploadFile, getEnv())
    } else {
      uploadQueue.push(
        new Promise((resolve, reject) => {
          resolve(task)
        })
      )
      setUploadQueue(uploadQueue)
    }
  }

  const readFile = <T extends TFileType>(files: T[]) => {
    const results: FileItem[] = []
    files.forEach((file: T, index: number) => {
      let fileType = file.type
      const filepath = (file.tempFilePath || file.path) as string
      const fileItem = new FileItem()
      if (file.fileType) {
        fileType = file.fileType
      } else {
        const imgReg = /\.(png|jpeg|jpg|webp|gif)$/i
        if (
          !fileType &&
          (imgReg.test(filepath) || filepath.includes('data:image'))
        ) {
          fileType = 'image'
        }
      }

      fileItem.path = filepath
      fileItem.name = filepath
      fileItem.status = 'ready'
      fileItem.type = fileType
      fileItem.uid = `${fileItem.uid}_${index}`
      fileItem.message = autoUpload
        ? locale.uploader.readyUpload
        : locale.uploader.waitingUpload

      if (getEnv() === 'WEB') {
        const formData = new FormData()
        for (const [key, value] of Object.entries(data)) {
          formData.append(key, value as any)
        }
        formData.append(name, file.originalFileObj as Blob)
        fileItem.name = file.originalFileObj?.name
        fileItem.type = file.originalFileObj?.type
        fileItem.formData = formData
      } else {
        fileItem.formData = data as any
      }
      if (preview) {
        fileItem.url = fileType === 'video' ? file.thumbTempFilePath : filepath
      }
      executeUpload(fileItem, index)
      results.push(fileItem)
    })
    setFileList([...fileList, ...results])
  }

  const filterFiles = <T extends TFileType>(files: T[]) => {
    const maximum = (maxCount as number) * 1
    const maximize = (maxFileSize as number) * 1
    const oversizes = new Array<T>()
    const filterFile = files.filter((file: T) => {
      if (file.size > maximize) {
        oversizes.push(file)
        return false
      }
      return true
    })
    oversizes.length && onOversize?.(files as any)

    const currentFileLength = filterFile.length + fileList.length
    if (currentFileLength > maximum) {
      filterFile.splice(filterFile.length - (currentFileLength - maximum))
    }
    return filterFile
  }

  const deleted = (file: FileItem, index: number) => {
    const deletedFileList = fileList.filter((file, idx) => idx !== index)
    onDelete?.(file, deletedFileList)
    setFileList(deletedFileList)
  }

  const onDeleteItem = (file: FileItem, index: number) => {
    clearUploadQueue(index)
    funcInterceptor(beforeDelete, {
      args: [file, fileList],
      done: () => deleted(file, index),
    })
  }

  const onChangeMedia = (res: Taro.chooseMedia.SuccessCallbackResult) => {
    // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
    const { tempFiles } = res
    const _files: Taro.chooseMedia.ChooseMedia[] = filterFiles(tempFiles)
    if (beforeUpload) {
      beforeUpload(new Array<File>().slice.call(_files)).then(
        (f: Array<File> | boolean) => {
          const _files: File[] = filterFiles(new Array<File>().slice.call(f))
          if (!_files.length) res.tempFiles = []
          readFile(_files)
        }
      )
    } else {
      readFile(_files)
    }
  }

  const onChangeImage = (res: Taro.chooseImage.SuccessCallbackResult) => {
    // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
    const { tempFiles } = res
    const _files: Taro.chooseImage.ImageFile[] = filterFiles(tempFiles)
    if (beforeUpload) {
      beforeUpload(new Array<File>().slice.call(_files)).then(
        (f: Array<File> | boolean) => {
          const _files: File[] = filterFiles(new Array<File>().slice.call(f))
          if (!_files.length) res.tempFiles = []
          readFile(_files)
        }
      )
    } else {
      readFile(_files)
    }
  }

  const handleItemClick = (file: FileItem, index: number) => {
    onFileItemClick?.(file, index)
  }

  return (
    <div className={classes} {...restProps}>
      {(children || previewType === 'list') && (
        <div className="nut-uploader-slot">
          <>
            {children || (
              <Button nativeType="button" size="small" type="primary">
                {locale.uploader.list}
              </Button>
            )}
            {Number(maxCount) > fileList.length && (
              <Button
                nativeType="button"
                className="nut-uploader-input"
                onClick={_chooseImage}
              />
            )}
          </>
        </div>
      )}

      <Preview
        {...{
          fileList,
          previewType,
          deletable,
          onDeleteItem,
          handleItemClick,
          previewUrl,
          deleteIcon,
          children,
        }}
      />

      {Number(maxCount) > fileList.length &&
        previewType === 'picture' &&
        !children && (
          <div
            className={`nut-uploader-upload ${previewType} ${
              disabled ? 'nut-uploader-upload-disabled' : ''
            }`}
          >
            <div className="nut-uploader-icon">
              {uploadIcon}
              <span className="nut-uploader-icon-tip">{uploadLabel}</span>
            </div>
            <Button
              nativeType="button"
              className="nut-uploader-input"
              onClick={_chooseImage}
            />
          </div>
        )}
    </div>
  )
}

export const Uploader = React.forwardRef(InternalUploader)

Uploader.displayName = 'NutUploader'
