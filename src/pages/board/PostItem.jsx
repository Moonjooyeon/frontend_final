import React, { useEffect, useState } from "react";
import PostForm from "./PostForm.jsx";

export default function PostItem({ post, open, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);

  // 닫히면 편집모드 종료
  useEffect(() => {
    if (!open) setEditing(false);
  }, [open]);

  return (
    <li data-post-id={post.id} className="post-item">
      <button className="post-title" onClick={onToggle}>
        {post.title}
      </button>

      <div className={`post-content-wrap ${open ? "open" : ""}`}>
        {!open ? null : !editing ? (
          <div className="post-content-row">
            <div className="post-content">
              {post.content || <span className="empty">내용이 없습니다.</span>}
            </div>
            <div className="content-actions">
              <button className="btn sm" onClick={() => setEditing(true)}>
                수정
              </button>
              <button className="btn sm danger" onClick={onDelete}>
                삭제
              </button>
            </div>
          </div>
        ) : (
          <div className="post-editing">
            <PostForm
              mode="edit"
              init={{ title: post.title, content: post.content || "" }}
              onSubmit={(data) => {
                if (onEdit?.(data)) setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          </div>
        )}
      </div>
    </li>
  );
}
