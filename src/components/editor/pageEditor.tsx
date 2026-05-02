"use client";

import { Editor } from "@tinymce/tinymce-react";

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function PageEditor({ value, onChange }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <Editor
        tinymceScriptSrc="https://cdn.jsdelivr.net/npm/tinymce@7/tinymce.min.js"
        apiKey="gz0vccrxxqfout41hqr8gthfroa4l5qnrgjmgdqmjhuw0tfr"
        value={value}
        onEditorChange={(content) => onChange(content)}
        init={{
          height: 500,
          menubar: true,
          toolbar_mode: "wrap",
          ui_mode: "split",

          // FIX
          fixed_toolbar_container: false,

          zindex: 9999999,

          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "help",
            "wordcount",
          ],

          toolbar:
            "undo redo | blocks | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | code fullscreen preview",

          image_title: true,
          automatic_uploads: true,
          file_picker_types: "image",

          // MOST IMPORTANT
          dialog_type: "modal",
        }}
      />
    </div>
  );
}
