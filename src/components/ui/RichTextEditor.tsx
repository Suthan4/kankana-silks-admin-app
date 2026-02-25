"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {Table} from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import React, { useEffect } from "react";

import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Undo,
  Redo,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: Props) {
const editor = useEditor({
  // immediatelyRender: false,
  extensions: [
    StarterKit,

    TextStyle,
    Color,

    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),

    Link.configure({
      openOnClick: false,
    }),

    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,

    Placeholder.configure({
      placeholder: "Write product description...",
    }),
  ],

  content: value || "",

  onUpdate: ({ editor }) => {
    onChange(editor.getHTML());
  },

  editorProps: {
    attributes: {
      class: "focus:outline-none min-h-[200px] cursor-text caret-black",
    },
  },
});
// 🔥 IMPORTANT — sync external value
useEffect(() => {
    if (!editor) return;
    console.log("bullet",editor.isActive("bulletList"));

  const currentHTML = editor.getHTML();

  // only update if truly different
  if (value && value !== currentHTML) {
    editor.commands.setContent(value, {
        emitUpdate:false
    });
  }
}, [value, editor]);

if (!editor) return null;

  const btn =
    "p-2 rounded hover:bg-gray-100 border border-gray-200 text-gray-700";

  return (
    <div
      className="border border-gray-300 rounded-xl overflow-hidden bg-white cursor-text focus-within:ring-2 focus-within:ring-blue-500"
      onClick={() => editor.chain().focus().run()}
    >
      {/* Toolbar */}{" "}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </button>
        <input
          type="color"
          className="w-8 h-8 border rounded cursor-pointer"
          onChange={(e) =>
            editor.chain().focus().setColor(e.target.value).run()
          }
        />
        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight size={16} />
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <AlignJustify size={16} />
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            const url = prompt("Enter URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          <LinkIcon size={16} />
        </button>
        <button
          type="button"
          className={btn}
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()
          }
        >
          Table
        </button>

        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        >
          +Col
        </button>

        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().addRowAfter().run()}
        >
          +Row
        </button>

        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().deleteTable().run()}
        >
          Del
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo size={16} />
        </button>
      </div>
      {/* Editor */}
      <EditorContent
        editor={editor}
        className="focus:outline-none min-h-[200px] cursor-text caret-black"
      />
    </div>
  );
}
