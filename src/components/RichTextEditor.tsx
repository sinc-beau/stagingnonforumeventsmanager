import { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .quill-editor .ql-container {
        font-family: inherit;
        font-size: 0.875rem;
        border-bottom-left-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
        border-color: rgb(203 213 225);
      }
      .quill-editor .ql-toolbar {
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;
        border-color: rgb(203 213 225);
        background-color: rgb(248 250 252);
      }
      .quill-editor .ql-editor {
        min-height: 80px;
        max-height: 200px;
        overflow-y: auto;
      }
      .quill-editor .ql-editor.ql-blank::before {
        color: rgb(148 163 184);
        font-style: normal;
      }
      .quill-editor .ql-stroke {
        stroke: rgb(71 85 105);
      }
      .quill-editor .ql-fill {
        fill: rgb(71 85 105);
      }
      .quill-editor .ql-picker-label {
        color: rgb(71 85 105);
      }
      .quill-editor:focus-within .ql-toolbar,
      .quill-editor:focus-within .ql-container {
        border-color: rgb(15 23 42);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ]
  };

  const formats = [
    'bold', 'italic', 'underline',
    'list', 'bullet'
  ];

  return (
    <div className="quill-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
