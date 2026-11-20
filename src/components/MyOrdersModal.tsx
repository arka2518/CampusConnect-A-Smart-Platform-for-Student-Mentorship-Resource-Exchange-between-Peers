import React, { useState } from 'react';
import { MyOrdersSummary, Order, OrderItem, Resource, UserProfile } from '../types';
import {
  X,
  ShoppingBag,
  KeyRound,
  Phone,
  Mail,
  MapPin,
  Copy,
  Check,
  CheckCircle2,
  RotateCcw,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { cancelResourceReservation } from '../api/resourcesApi';

interface MyOrdersModalProps {
  isOpen: boolean;
  orders: Order[];
  summary: MyOrdersSummary;
  currentUser: UserProfile | null;
  isBackendLive: boolean;
  onClose: () => void;
  onReservationCancelled: (updatedResource: Resource, reservationId: string) => void;
  onNotify: (message: string, subtext?: string) => void;
}

type OrderFilter = 'All' | 'Pending Pickup' | 'Completed' | 'Cancelled';

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({
  isOpen,
  orders,
  summary,
  currentUser,
  isBackendLive,
  onClose,
  onReservationCancelled,
  onNotify,
}) => {
  const [filter, setFilter] = useState<OrderFilter>('All');
  const [copiedOtpId, setCopiedOtpId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const matchesFilter = (item: OrderItem): boolean => {
    if (filter === 'All') return true;
    if (filter === 'Pending Pickup') return item.reservationStatus === 'Pending Handoff';
    if (filter === 'Completed') return item.reservationStatus === 'Verified & Complete';
    return item.reservationStatus === 'Cancelled';
  };

  const visibleOrders = orders
    .map((order) => ({
      ...order,
      items: order.items.filter(matchesFilter),
    }))
    .filter((order) => order.items.length > 0);

  const handleCopyOtp = (reservationId: string, otp: string) => {
    void navigator.clipboard?.writeText(otp);
    setCopiedOtpId(reservationId);
    setTimeout(() => setCopiedOtpId(null), 2000);
  };

  const handleCancelItem = async (item: OrderItem) => {
    setError(null);
    setCancellingId(item.reservationId);
    try {
      if (isBackendLive) {
        const updatedResource = await cancelResourceReservation(item.reservationId, currentUser);
        onReservationCancelled(updatedResource, item.reservationId);
      } else {
        onReservationCancelled(
          {
            id: item.resourceId,
            title: item.title,
            category: item.category as Resource['category'],
            price: item.price,
            originalPrice: Math.max(1, item.price),
            condition: 'Gently Used',
            image: item.image,
            courseCode: item.courseCode,
            courseName: item.courseCode,
            department: item.seller.department,
            seller: {
              id: item.seller.id,
              name: item.seller.name,
              year: 'Senior',
              department: item.seller.department,
              verified: true,
            },
            pickupLocation: item.pickupLocation,
            description: '',
            handwrittenNotesIncluded: false,
            edition: '',
            availableUntil: item.availableUntil,
            status: 'Available',
          },
          item.reservationId
        );
      }
      onNotify(
        'Reservation Cancelled',
        `"${item.title}" has been released back to Available.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel reservation.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#4A3C31]/65 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#F7F3EE] w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#EDE5D8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#FCE38A] p-5 sm:p-6 border-b border-[#EDE5D8] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#4A3C31] text-[#FCE38A] rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#4A3C31]">My Orders & Active Pickup OTPs</h3>
              <p className="text-xs text-[#746356]">
                View your 4-digit handover OTPs, unmasked seller contacts, and campus meetup spots
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#4A3C31]/80 text-[#F7F3EE] hover:bg-[#4A3C31] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Metrics Bar */}
        <div className="grid grid-cols-3 gap-3 px-6 pt-5 pb-3">
          <div className="bg-[#FFF8DF] rounded-2xl p-3 border border-[#FCE38A] text-center">
            <div className="text-lg font-extrabold text-[#F38181]">{summary.pendingPickups}</div>
            <div className="text-[11px] font-semibold text-[#4A3C31]">Pending Pickup</div>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 text-center">
            <div className="text-lg font-extrabold text-emerald-700">{summary.completedPickups}</div>
            <div className="text-[11px] font-semibold text-emerald-800">Completed</div>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-[#EDE5D8] text-center">
            <div className="text-lg font-extrabold text-[#4A3C31]">{summary.totalOrders}</div>
            <div className="text-[11px] font-semibold text-[#746356]">Total Orders</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pb-3 flex items-center gap-1.5 overflow-x-auto border-b border-[#EDE5D8]">
          {(
            [
              { key: 'All', label: `All (${summary.totalOrders})` },
              { key: 'Pending Pickup', label: `Pending Pickup (${summary.pendingPickups})` },
              { key: 'Completed', label: `Completed (${summary.completedPickups})` },
              { key: 'Cancelled', label: `Cancelled (${summary.cancelledPickups})` },
            ] as Array<{ key: OrderFilter; label: string }>
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filter === tab.key
                  ? 'bg-[#4A3C31] text-[#F7F3EE]'
                  : 'bg-white text-[#746356] hover:bg-[#EDE5D8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Scroll List */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {visibleOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#EDE5D8] space-y-2.5">
              <ShoppingBag className="w-10 h-10 text-[#D8CEBE] mx-auto" />
              <p className="text-sm font-bold text-[#4A3C31]">
                {filter === 'All'
                  ? "You haven't placed any orders or reservations yet."
                  : `No items under "${filter}".`}
              </p>
              <p className="text-xs text-[#746356]">
                Add textbooks or equipment to your Cart and place an order to see your pickup OTPs here.
              </p>
            </div>
          ) : (
            visibleOrders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              });

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-[#EDE5D8] overflow-hidden shadow-xs"
                >
                  {/* Order Top Header */}
                  <div className="bg-[#FFF8DF] px-4 py-3 border-b border-[#EDE5D8] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-[#4A3C31] tracking-wide">
                        {order.orderNumber}
                      </span>
                      <span className="text-[#99897D]">•</span>
                      <span className="text-[#746356] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formattedDate}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-[#EDE5D8] text-[#4A3C31]">
                        {order.paymentMethod}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#4A3C31]">
                        Total: ₹{order.totalAmount.toLocaleString()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.status === 'Completed'
                            ? 'bg-emerald-600 text-white'
                            : order.status === 'Cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-[#4A3C31] text-[#FCE38A]'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="divide-y divide-[#EDE5D8]">
                    {order.items.map((item) => {
                      const isPending = item.reservationStatus === 'Pending Handoff';
                      const isComplete = item.reservationStatus === 'Verified & Complete';
                      const isCancelling = cancellingId === item.reservationId;

                      return (
                        <div key={item.reservationId} className="p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row gap-3.5">
                            <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden bg-[#EDE5D8] shrink-0">
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
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F38181]">
                                    {item.courseCode} · {item.category}
                                  </span>
                                  <h4 className="font-bold text-sm text-[#4A3C31]">{item.title}</h4>
                                </div>
                                <span className="font-extrabold text-sm text-[#4A3C31] shrink-0">
                                  {item.price === 0 ? 'Free' : `₹${item.price}`}
                                </span>
                              </div>

                              {/* Pickup & Unmasked Seller Contact */}
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                                <div className="flex items-center gap-1.5 text-[#4A3C31] bg-[#F7F3EE] px-2.5 py-1.5 rounded-lg">
                                  <MapPin className="w-3.5 h-3.5 text-[#F38181] shrink-0" />
                                  <span className="truncate">{item.pickupLocation}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[#4A3C31] bg-[#F7F3EE] px-2.5 py-1.5 rounded-lg">
                                  <Phone className="w-3.5 h-3.5 text-[#F38181] shrink-0" />
                                  <span className="font-semibold truncate">
                                    {item.seller.name}: {item.seller.phone}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#746356]">
                                <Mail className="w-3 h-3 text-[#F38181]" />
                                <span>{item.seller.email}</span>
                              </div>
                            </div>
                          </div>

                          {/* OTP Handover Box (Pending) */}
                          {isPending && item.otpCode && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <KeyRound className="w-4 h-4 text-emerald-700 shrink-0" />
                                <div className="text-xs text-emerald-900">
                                  <span className="font-bold">Pickup OTP: </span>
                                  <span className="font-extrabold text-base tracking-widest bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300 mx-1">
                                    {item.otpCode}
                                  </span>
                                  <span className="text-emerald-700 hidden sm:inline">
                                    (Share with {item.seller.name} at meetup)
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCopyOtp(item.reservationId, item.otpCode!)}
                                  className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 transition-colors"
                                >
                                  {copiedOtpId === item.reservationId ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      Copy OTP
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  disabled={isCancelling}
                                  onClick={() => void handleCancelItem(item)}
                                  className="px-2.5 py-1.5 rounded-lg bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                                >
                                  {isCancelling ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <RotateCcw className="w-3 h-3" />
                                  )}
                                  Cancel Hold
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Completed Handover */}
                          {isComplete && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                              <span>OTP Verified · Physical Handover Completed</span>
                            </div>
                          )}

                          {/* Cancelled */}
                          {item.reservationStatus === 'Cancelled' && (
                            <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-red-700">
                              Reservation Cancelled · Item Released
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
