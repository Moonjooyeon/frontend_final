import React, { useEffect, useRef, useState } from "react";

export default function PostForm({
  mode = "create",
  init = { title: "", content: "" },
  onSubmit,
  onCancel,
}) {
  const LIMIT = { title: 20, content: 200 };
  const [form, setForm] = useState({
    title: init.title || "",
    content: init.content || "",
  });
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const change = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = () => onSubmit?.(form);
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <>
      <label className="label">
        제목 (최대 {LIMIT.title}자) <span className="required">*</span>
      </label>
      <input
        ref={titleRef}
        className="input"
        maxLength={LIMIT.title}
        value={form.title}
        onChange={change("title")}
        onKeyDown={onKey}
        placeholder="제목을 입력하세요"
      />
      <div className="counter">
        {form.title.length}/{LIMIT.title}
      </div>

      <label className="label">
        내용 (최대 {LIMIT.content}자{mode === "create" ? ", 선택" : ""})
      </label>
      <textarea
        className="textarea"
        rows={4}
        maxLength={LIMIT.content}
        value={form.content}
        onChange={change("content")}
        onKeyDown={onKey}
        placeholder="내용을 입력하세요 (비워도 등록 가능)"
      />
      <div className="counter">
        {form.content.length}/{LIMIT.content}
      </div>

      <div className="editor-actions">
        <button className="btn primary" onClick={submit}>
          {mode === "create" ? "등록완료" : "수정완료"}
        </button>
        <button className="btn" onClick={onCancel}>
          취소
        </button>
      </div>
    </>
  );
}
