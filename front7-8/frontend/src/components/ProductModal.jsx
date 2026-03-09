import React, { useEffect, useState } from 'react';

const EMPTY = { name: '', category: '', description: '', price: '', stock: '', rating: '' };

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (initialProduct) {
      setForm({
        name: initialProduct.name ?? '',
        category: initialProduct.category ?? '',
        description: initialProduct.description ?? '',
        price: initialProduct.price != null ? String(initialProduct.price) : '',
        stock: initialProduct.stock != null ? String(initialProduct.stock) : '',
        rating: initialProduct.rating != null ? String(initialProduct.rating) : '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, initialProduct]);

  if (!open) return null;

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const category = form.category.trim();
    const description = form.description.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);
    const rating = form.rating !== '' ? Number(form.rating) : null;

    if (!name) return alert('Введите название');
    if (!category) return alert('Введите категорию');
    if (!description) return alert('Введите описание');
    if (!Number.isFinite(price) || price < 0) return alert('Введите корректную цену');
    if (!Number.isInteger(stock) || stock < 0) return alert('Введите корректное количество');
    if (rating !== null && (rating < 1 || rating > 5)) return alert('Рейтинг: от 1 до 5');

    onSubmit({ id: initialProduct?.id, name, category, description, price, stock, rating });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title">{mode === 'edit' ? 'Редактирование товара' : 'Новый товар'}</div>
          <button className="iconBtn" onClick={onClose}>✕</button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input className="input" value={form.name} onChange={set('name')} placeholder="Например, Дюна" autoFocus />
          </label>
          <label className="label">
            Категория
            <input className="input" value={form.category} onChange={set('category')} placeholder="Например, Фантастика" />
          </label>
          <label className="label">
            Описание
            <textarea className="textarea" value={form.description} onChange={set('description')} placeholder="Краткое описание товара" />
          </label>
          <div className="formRow">
            <label className="label">
              Цена (₽)
              <input className="input" value={form.price} onChange={set('price')} placeholder="490" inputMode="numeric" />
            </label>
            <label className="label">
              На складе (шт.)
              <input className="input" value={form.stock} onChange={set('stock')} placeholder="10" inputMode="numeric" />
            </label>
          </div>
          <label className="label">
            Рейтинг (1–5, необязательно)
            <input className="input" value={form.rating} onChange={set('rating')} placeholder="5" inputMode="numeric" />
          </label>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn--primary">{mode === 'edit' ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}