import React from 'react';

export default function ProductItem({ product, onEdit, onDelete }) {
  const stars = product.rating ? '★'.repeat(product.rating) + '☆'.repeat(5 - product.rating) : null;
  return (
    <div className="productCard">
      <div className="productHeader">
        <div className="productName">{product.name}</div>
        <div className="productCategory">{product.category}</div>
      </div>
      <div className="productDescription">{product.description}</div>
      <div className="productMeta">
        <span className="productPrice">{product.price} ₽</span>
        <span className="productStock">На складе: {product.stock} шт.</span>
        {stars && <span className="productRating">{stars}</span>}
      </div>
      <div className="productActions">
        <button className="btn" onClick={() => onEdit(product)}>Редактировать</button>
        <button className="btn btn--danger" onClick={() => onDelete(product.id)}>Удалить</button>
      </div>
    </div>
  );
}