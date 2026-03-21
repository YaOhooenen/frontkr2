import React, { useState } from "react";
import { api } from "../../api";
import "./AuthPage.scss";

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  });
  const [message, setMessage] = useState({ text: "", success: false });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", success: false });
    setLoading(true);
    try {
      if (mode === "register") {
        await api.register(form);
        setMode("login");
        setMessage({
          text: "Регистрация прошла успешно! Войдите в аккаунт.",
          success: true,
        });
      } else {
        const data = await api.login({
          email: form.email,
          password: form.password,
        });
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        const me = await api.me();
        onLogin({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: me,
        });
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Произошла ошибка",
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <div className="authBrand">📚 Book Shop</div>
        <div className="authTabs">
          <button
            className={`authTab ${mode === "login" ? "authTab--active" : ""}`}
            onClick={() => {
              setMode("login");
              setMessage({ text: "", success: false });
            }}
          >
            Вход
          </button>
          <button
            className={`authTab ${mode === "register" ? "authTab--active" : ""}`}
            onClick={() => {
              setMode("register");
              setMessage({ text: "", success: false });
            }}
          >
            Регистрация
          </button>
        </div>
        {message.text && (
          <div
            className={`authMessage ${message.success ? "authMessage--success" : "authMessage--error"}`}
          >
            {message.text}
          </div>
        )}
        <form className="authForm" onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label className="authLabel">
                Имя
                <input
                  className="authInput"
                  value={form.first_name}
                  onChange={set("first_name")}
                  placeholder="Иван"
                />
              </label>
              <label className="authLabel">
                Фамилия
                <input
                  className="authInput"
                  value={form.last_name}
                  onChange={set("last_name")}
                  placeholder="Иванов"
                />
              </label>
            </>
          )}
          <label className="authLabel">
            Email
            <input
              className="authInput"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="ivan@mail.ru"
            />
          </label>
          <label className="authLabel">
            Пароль
            <input
              className="authInput"
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="••••••••"
            />
          </label>
          <button className="authBtn" type="submit" disabled={loading}>
            {loading
              ? "Загрузка..."
              : mode === "login"
                ? "Войти"
                : "Зарегистрироваться"}
          </button>
        </form>
      </div>
    </div>
  );
}
