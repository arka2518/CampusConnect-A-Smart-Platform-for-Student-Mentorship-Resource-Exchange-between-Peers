import React, { useState } from 'react';
import { CartResponse, Order, UserProfile } from '../types';
import {
  X,
  ShoppingCart,
  Trash2,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wallet,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { checkoutCartApi } from '../api/ordersApi';

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartResponse;
  currentUser: UserProfile | null;
  isBackendLive: boolean;
  onClose: () => void;
  onRemoveItem: (resourceId: string) => Promise<void>;
  onClearCart: () => Promise<void>;
  onCheckoutSuccess: (order: Order) => void;
  onRequireLogin: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  cart,
  currentUser,
  isBackendLive,
  onClose,
  onRemoveItem,
  onClearCart,
  onCheckoutSuccess,
  onRequireLogin,
}) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasUnavailable = cart.unavailableCount > 0;
  const canCheckout = cart.availableCount > 0 && !hasUnavailable && !isCheckingOut;

  const handleRemove = async (resourceId: string) => {
    setError(null);
    setBusyItemId(resourceId);
    try {
      await onRemoveItem(resourceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item.');
    } finally {
      setBusyItemId(null);
    }
  };

  const handlePlaceOrder = async () => {
    setError(null);

    if (!currentUser) {
      onRequireLogin();
      return;
    }

    if (hasUnavailable) {
      setError('Please remove unavailable items from your cart before placing the order.');
      return;
    }

    setIsCheckingOut(true);
    try {
      let placedOrder: Order;

      if (isBackendLive) {
        placedOrder = await checkoutCartApi(currentUser);
      } else {
        // Offline demo checkout fallback
        placedOrder = {
          id: `local-order-${Date.now()}`,
          orderNumber: `CC-26-${Math.floor(1000 + Math.random() * 9000)}`,
          totalAmount: cart.totalAmount,
          paymentMethod: 'Pay at Campus Meetup (UPI / Cash)',
          status: 'Active',
          createdAt: new Date().toISOString(),
          isDirectReservation: false,
          items: cart.items.map((item) => ({
            resourceId: item.resourceId,
            reservationId: `local-res-${item.resourceId}`,
            title: item.title,
            category: item.category,
            courseCode: item.courseCode,
            image: item.image,
            price: item.price,
            pickupLocation: item.pickupLocation,
            availableUntil: item.availableUntil,
            reservationStatus: 'Pending Handoff',
            otpCode: String(Math.floor(1000 + Math.random() * 9000)),
            seller: {
              id: item.seller.id,
              name: item.seller.name,
              department: item.seller.department,
              phone: '+91 98765 43210',
              email: `${item.seller.name.toLowerCase().replace(/\s+/g, '.')}@mit.edu`,
            },
          })),
        };
      }

      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#FCE38A', '#F38181', '#10b981', '#4A3C31'],
      });

      onCheckoutSuccess(placedOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please refresh your cart.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#4A3C31]/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#F7F3EE] w-full max-w-md h-full shadow-2xl flex flex-col border-l border-[#EDE5D8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#FCE38A] p-5 border-b border-[#EDE5D8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#4A3C31] text-[#FCE38A] rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#4A3C31]">
                Campus Cart ({cart.items.length})
              </h3>
              <p className="text-xs text-[#746356]">
                Bundle items & generate pickup OTPs in one click
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#4A3C31]/80 text-[#F7F3EE] hover:bg-[#4A3C31] transition-colors"
            aria-label="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items Scroll Area */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {hasUnavailable && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                {cart.unavailableCount} item{cart.unavailableCount > 1 ? 's were' : ' was'} just claimed by another student. Remove {cart.unavailableCount > 1 ? 'them' : 'it'} below to proceed.
              </span>
            </div>
          )}

          {cart.items.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#EDE5D8] space-y-3 mt-6">
              <ShoppingCart className="w-10 h-10 text-[#D8CEBE] mx-auto" />
              <h4 className="font-bold text-sm text-[#4A3C31]">Your Campus Cart is empty</h4>
              <p className="text-xs text-[#746356] leading-relaxed">
                Browse textbooks, calculators, or lab kits in the Resource Exchange section and click <strong>Add to Cart</strong>.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-[#746356] px-1">
                <span>{cart.availableCount} item{cart.availableCount === 1 ? '' : 's'} ready for pickup</span>
                <button
                  type="button"
                  onClick={() => void onClearCart()}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Clear Cart
                </button>
              </div>

              {cart.items.map((item) => {
                const isRemoving = busyItemId === item.resourceId;
                return (
                  <div
                    key={item.resourceId}
                    className={`bg-white rounded-2xl p-3.5 border shadow-xs flex gap-3 ${
                      item.isAvailable
                        ? 'border-[#EDE5D8]'
                        : 'border-red-300 bg-red-50/40 opacity-90'
                    }`}
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#EDE5D8] shrink-0">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/resources/res-1.jpg';
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-[#4A3C31] line-clamp-1">
                          {item.title}
                        </h4>
                        <button
                          type="button"
                          disabled={isRemoving}
                          onClick={() => void handleRemove(item.resourceId)}
                          className="text-[#99897D] hover:text-red-600 p-1 transition-colors shrink-0"
                          title="Remove from cart"
                        >
                          {isRemoving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-[#746356] mt-0.5">
                        <span className="font-bold text-[#4A3C31]">{item.courseCode}</span>
                        <span>•</span>
                        <span className="truncate">by {item.seller.name}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-[#746356] mt-1">
                        <MapPin className="w-3 h-3 text-[#F38181] shrink-0" />
                        <span className="truncate">{item.pickupLocation}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#EDE5D8]">
                        {item.isAvailable ? (
                          <span className="text-[10px] font-bold text-[#ff1d1d] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Until {item.availableUntil}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                            No Longer Available ({item.status})
                          </span>
                        )}
                        <span className="font-extrabold text-sm text-[#4A3C31]">
                          {item.price === 0 ? 'Free' : `₹${item.price}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Checkout Summary Footer */}
        {cart.items.length > 0 && (
          <div className="p-5 bg-white border-t border-[#EDE5D8] space-y-3.5 shrink-0">
            {/* Option A: Pay at Campus Meetup Escrow Box */}
            <div className="bg-[#FFF8DF] border border-[#FCE38A] rounded-2xl p-3 flex items-start gap-2.5">
              <Wallet className="w-4 h-4 text-[#4A3C31] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#4A3C31]">
                <span className="font-bold block">Pay at Campus Meetup (UPI / Cash)</span>
                <span className="text-[#746356]">
                  Zero platform fees. Confirming locks every item atomically & generates your 4-digit pickup OTPs.
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[#746356]">
                <span>Platform / Brokerage Fee</span>
                <span className="font-bold text-emerald-700">₹0 (Free Peer Exchange)</span>
              </div>
              <div className="flex items-center justify-between text-base font-extrabold text-[#4A3C31] pt-1.5 border-t border-[#EDE5D8]">
                <span>Total Due at Meetup</span>
                <span>₹{cart.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={!canCheckout}
              onClick={() => void handlePlaceOrder()}
              className="w-full py-3.5 rounded-2xl bg-[#F38181] hover:bg-[#EA6E6E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isCheckingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {isCheckingOut
                  ? 'Locking Items & Generating OTPs...'
                  : `Place Order · ₹${cart.totalAmount.toLocaleString()}`}
              </span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#746356]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Seller phone & email unmask immediately upon confirmation</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
