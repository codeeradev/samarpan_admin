import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function PageEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Link, Image],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 p-2">
        <button onClick={() => editor.chain().focus().toggleBold().run()}>
          Bold
        </button>

        <button onClick={() => editor.chain().focus().toggleItalic().run()}>
          Italic
        </button>

        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </button>

        <button onClick={() => editor.chain().focus().toggleBulletList().run()}>
          List
        </button>

        <button
          onClick={() => {
            const url = prompt("Enter URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          Link
        </button>

        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          Code
        </button>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="min-h-[320px] p-4 prose max-w-none"
      />
    </div>
  );
}