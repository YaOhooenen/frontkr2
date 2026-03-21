import React, { useEffect, useState } from 'react';
import './ShopPage.scss';
import ProductList from '../../components/ProductList';
import ProductModal from '../../components/ProductModal';
import { api } from '../../api';

export default function ShopPage({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products'); // 'products' | 'users'
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);

  const isAdmin = user.role === 'admin';
  const isSeller = user.role === 'seller' || user.role === 'admin';

  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { if (tab === 'users' && isAdmin) loadUsers(); }, [tab]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch { alert('Ошибка загрузки товаров'); }
    finally { setLoading(false); }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch { alert('Ошибка загрузки пользователей'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setModalMode('create'); setEditingProduct(null); setModalOpen(true); };
  const openEdit = (product) => { setModalMode('edit'); setEditingProduct(product); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingProduct(null); };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch { alert('Ошибка удаления товара'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Заблокировать пользователя?')) return;
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch { alert('Ошибка блокировки пользователя'); }
  };

  const handleSubmitModal = async (payload) => {
    try {
      if (modalMode === 'create') {
        const newProduct = await api.createProduct(payload);
        setProducts(prev => [...prev, newProduct]);
      } else {
        const updated = await api.updateProduct(payload.id, payload);
        setProducts(prev => prev.map(p => p.id === payload.id ? updated : p));
      }
      closeModal();
    } catch { alert('Ошибка сохранения товара'); }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">📚 Book Shop</div>
          <div className="header__right">
            <span className="userInfo">{user.first_name} · <span className="role">{user.role}</span></span>
            <button className="btn btn--logout" onClick={onLogout}>Выйти</button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {isAdmin && (
            <div className="tabs">
              <button className={`tab ${tab === 'products' ? 'tab--active' : ''}`} onClick={() => setTab('products')}>Товары</button>
              <button className={`tab ${tab === 'users' ? 'tab--active' : ''}`} onClick={() => setTab('users')}>Пользователи</button>
            </div>
          )}

          {tab === 'products' && (
            <>
              <div className="toolbar">
                <h1 className="title">Каталог книг</h1>
                {isSeller && <button className="btn btn--primary" onClick={openCreate}>+ Добавить</button>}
              </div>
              {loading ? <div className="empty">Загрузка...</div> : (
                <ProductList products={products} onEdit={isSeller ? openEdit : null} onDelete={isAdmin ? handleDelete : null} />
              )}
            </>
          )}

          {tab === 'users' && isAdmin && (
            <>
              <div className="toolbar">
                <h1 className="title">Пользователи</h1>
              </div>
              {loading ? <div className="empty">Загрузка...</div> : (
                <div className="list">
                  {users.map(u => (
                    <div key={u.id} className="userCard">
                      <div className="userInfo">
                        <div className="userName">{u.first_name} {u.last_name}</div>
                        <div className="userEmail">{u.email}</div>
                        <div className="userRole">{u.role}</div>
                      </div>
                      <div className="userActions">
                        <button className="btn btn--danger" onClick={() => handleDeleteUser(u.id)}>Заблокировать</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer__inner">© {new Date().getFullYear()} Book Shop</div>
      </footer>

      <ProductModal open={modalOpen} mode={modalMode} initialProduct={editingProduct} onClose={closeModal} onSubmit={handleSubmitModal} />
    </div>
  );
}