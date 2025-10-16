import React, { useEffect, useRef, useState } from "react";
import "./Board.css";
import PostForm from "./PostForm.jsx";
import PostItem from "./PostItem.jsx";

export default function Board() {
  // 데이터 상태
  const [posts, setPosts] = useState([]); // [{ id, title, content }]
  const [openId, setOpenId] = useState(null);

  // UI 상태
  const [showCreate, setShowCreate] = useState(false);

  // ID 카운터 (ref 사용)
  const nextIdRef = useRef(1);

  // 바깥 클릭 시 펼침 닫기
  useEffect(() => {
    if (!openId) return;
    const onDown = (e) => {
      const el = e.target.closest("[data-post-id]");
      const clickedId = el ? Number(el.dataset.postId) : null;
      if (clickedId !== openId) setOpenId(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openId]);

  // 펼치기/닫기
  const onToggle = (id) => {
    setOpenId((v) => (v === id ? null : id));
  };

  // 등록
  const onCreate = ({ title, content }) => {
    const t = (title || "").trim();
    const c = (content || "").trim();
    if (!t) return false;

    const id = nextIdRef.current++;
    const newPost = { id, title: t, content: c };

    setPosts((prev) => [newPost, ...prev]);
    setOpenId(id);
    setShowCreate(false);
    alert("정상적으로 게시글이 등록되었습니다!");
    return true;
  };

  // 수정
  const onEdit = (id, { title, content }) => {
    const t = (title || "").trim();
    const c = (content || "").trim();
    if (!t) return false;

    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title: t, content: c } : p))
    );
    alert("정상적으로 수정되었습니다!");
    return true;
  };

  // 삭제
  const onDelete = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setOpenId((v) => (v === id ? null : v));
  };

  return (
    <div className="saas">
      <h2>자유게시판</h2>

      {/* 등록 버튼 */}
      <div className="board-header">
        <button className="btn" onClick={() => setShowCreate((v) => !v)}>
          등록
        </button>
      </div>

      <ul className="post-list">
        {/* 등록 폼 */}
        {showCreate && (
          <li className="post-editor">
            <PostForm
              mode="create"
              onSubmit={(data) => {
                if (!onCreate(data)) alert("제목을 입력해주세요");
              }}
              onCancel={() => setShowCreate(false)}
            />
          </li>
        )}

        {/* 비어있을 때 안내 */}
        {posts.length === 0 && !showCreate && (
          <li className="empty-tip">
            아직 게시글이 없습니다. “등록” 버튼으로 첫 글을 추가해보세요.
          </li>
        )}

        {/* 목록 */}
        {posts.map((p) => (
          <PostItem
            key={p.id}
            post={p}
            open={openId === p.id}
            onToggle={() => onToggle(p.id)}
            onEdit={(data) => {
              if (onEdit(p.id, data)) return true;
              alert("제목을 입력해주세요");
              return false;
            }}
            onDelete={() => onDelete(p.id)}
          />
        ))}
      </ul>
    </div>
  );
}
