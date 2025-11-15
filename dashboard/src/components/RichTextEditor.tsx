import React, { useMemo, lazy, Suspense } from 'react'
import 'react-quill/dist/quill.snow.css'

// Importar ReactQuill con lazy loading para Vite
const ReactQuill = lazy(() => import('react-quill'))

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: boolean
  helperText?: string
  label?: string
  maxLength?: number
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  error = false,
  helperText,
  label,
  maxLength = 5000,
}) => {
  // Configuración de módulos de Quill
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ color: [] }, { background: [] }],
        ['link'],
        ['clean'],
      ],
    }),
    []
  )

  // Formatos permitidos
  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'color',
    'background',
    'link',
  ]

  // Calcular longitud del texto sin HTML
  const getTextLength = (html: string): number => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent?.length || 0
  }

  const handleChange = (content: string) => {
    const textLength = getTextLength(content)
    if (textLength <= maxLength) {
      onChange(content)
    }
  }

  const currentLength = getTextLength(value || '')
  
  // Asegurar que el valor sea string
  const editorValue = value || ''

  return (
    <div className="rich-text-editor-wrapper">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div
        className={`border rounded-md ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <Suspense fallback={<div className="border rounded-md p-4 bg-gray-50">Cargando editor...</div>}>
          <ReactQuill
            theme="snow"
            value={editorValue}
            onChange={handleChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
            style={{ minHeight: '200px' }}
          />
        </Suspense>
      </div>
      <div className="flex justify-between items-center mt-1">
        <span
          className={`text-xs ${
            error ? 'text-red-600' : 'text-gray-500'
          }`}
        >
          {helperText}
        </span>
        <span
          className={`text-xs ${
            currentLength > maxLength * 0.9
              ? 'text-orange-600'
              : 'text-gray-500'
          }`}
        >
          {currentLength}/{maxLength} caracteres
        </span>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-editor-wrapper .quill {
            background: white;
          }
          .rich-text-editor-wrapper .ql-container {
            min-height: 150px;
            font-size: 14px;
          }
          .rich-text-editor-wrapper .ql-editor {
            min-height: 150px;
          }
          .rich-text-editor-wrapper .ql-editor.ql-blank::before {
            color: #9ca3af;
            font-style: normal;
          }
        `
      }} />
    </div>
  )
}

export default RichTextEditor
