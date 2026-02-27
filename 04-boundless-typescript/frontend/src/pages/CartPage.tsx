import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PRODUCTS } from '../products';
import {
  fetchCartItems,
  removeItem,
  clearCart,
  submitCart,
  changeItemQuantity,
} from '../api';
import { getCartId, resetCartId } from '../cartId';
import type { CartItem, CartItemsView } from '../types';

export default function CartPage() {
  const [cart, setCart] = useState<CartItemsView | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const navigate = useNavigate();

  const cartId = getCartId();

  const refresh = useCallback(async () => {
    try {
      const data = await fetchCartItems(cartId);
      setCart(data);
    } catch {
      setCart({ cartId, totalPrice: 0, items: [] });
    }
  }, [cartId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const findProduct = (item: CartItem) =>
    PRODUCTS.find((p) => p.productId === item.productId);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    setBusy(true);
    try {
      await changeItemQuantity({ cartId, itemId, newQuantity });
      await refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to change quantity';
      showToast(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    setBusy(true);
    try {
      await removeItem({ cartId, itemId });
      showToast('Item removed', 'success');
      await refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to remove item';
      showToast(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    setBusy(true);
    try {
      await clearCart(cartId);
      showToast('Cart cleared', 'success');
      await refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to clear cart';
      showToast(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (!cart || cart.items.length === 0) return;
    setBusy(true);
    try {
      const orderedProducts = cart.items.map((item) => ({
        productId: item.productId,
        totalPrice: item.price * item.quantity,
      }));
      await submitCart({ cartId, orderedProducts });
      resetCartId();
      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to submit cart';
      showToast(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleNewCart = () => {
    resetCartId();
    setSubmitted(false);
    navigate('/');
  };

  if (submitted) {
    return (
      <div className="page">
        <div className="submitted-overlay">
          <div className="checkmark">✅</div>
          <h2>Order Submitted!</h2>
          <p>Thank you for your purchase.</p>
          <button className="new-cart-button" onClick={handleNewCart}>
            Start New Cart
          </button>
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const totalPrice = cart?.totalPrice ?? 0;

  return (
    <div className="page">
      <h1>Your Shopping Cart</h1>

      <p className="subtitle">Review your items and proceed to checkout</p>

      <div className="cart-limit-notice">
        <strong>Note:</strong> A cart can hold a maximum of 3 items.
      </div>

      {items.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some products from the catalog!</p>
          <Link to="/" className="nav-link" style={{ marginTop: 16, display: 'inline-block' }}>
            ← Browse Products
          </Link>
        </div>
      ) : (
        <div className="cart-container">
          <div className="cart-items">
            {items.map((item) => {
              const product = findProduct(item);
              return (
                <div className="cart-item" key={item.itemId}>
                  <div className="item-image">
                    {item.image || product?.emoji || '📦'}
                  </div>
                  <div className="item-details">
                    <div className="item-name">
                      {product?.name ?? item.productId}
                    </div>
                    <div className="item-description">
                      {item.description ?? product?.description ?? ''}
                    </div>
                    <div className="item-price">
                      {item.quantity > 1
                        ? `$${item.price.toFixed(2)} × ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`
                        : `$${item.price.toFixed(2)}`}
                    </div>
                    <div className="quantity-controls">
                      <button
                        className="quantity-btn"
                        disabled={busy || item.quantity <= 1}
                        onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        disabled={busy}
                        onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className="remove-button"
                    disabled={busy}
                    onClick={() => handleRemove(item.itemId)}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          <div className="summary-card">
            <div className="summary-title">Order Summary</div>

            <div className="summary-row">
              <span className="label">Items ({items.length})</span>
              <span className="value">${totalPrice.toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span className="label">Shipping</span>
              <span className="value">Free</span>
            </div>

            <div className="summary-row total">
              <span className="label">Total</span>
              <span className="value">${totalPrice.toFixed(2)}</span>
            </div>

            <button
              className="submit-button"
              disabled={busy || items.length === 0}
              onClick={handleSubmit}
            >
              {busy ? 'Submitting...' : 'Submit Cart'}
            </button>

            <button
              className="clear-button"
              disabled={busy}
              onClick={handleClear}
            >
              Clear Cart
            </button>

            <Link to="/" className="continue-link">
              Continue Shopping
            </Link>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
