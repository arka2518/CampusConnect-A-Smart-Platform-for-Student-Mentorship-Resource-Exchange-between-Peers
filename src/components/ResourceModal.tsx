import React, { useEffect, useState } from 'react';
import { Resource, UserProfile } from '../types';
import {
  X,
  BookOpen,
  MapPin,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  KeyRound,
  Phone,
  Mail,
  Trash2,
  Pencil,
  RotateCcw,
  AlertCircle,
  Loader2,
  ShoppingCart,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  cancelResourceReservation,
  deleteResourceListing,
  reserveResourceItem,
  verifyResourceOtp,
} from '../api/resourcesApi';

interface ResourceModalProps {
  resource: Resource | null;
  currentUser: UserProfile | null;
  isBackendLive: boolean;
  isInCart?: boolean;
  onAddToCart?: (resource: Resource) => void;
  onOpenCart?: () => void;
  onClose: () => void;
  onResourceUpdated: (updated: Resource) => void;
  onResourceDeleted: (id: string) => void;
  onEditListing?: (resource: Resource) => void;
  onNotify: (message: string, subtext?: string) => void;
  onRequireLogin: () => void;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({
  resource,
  currentUser,
  isBackendLive,
  isInCart = false,
  onAddToCart,
  onOpenCart,
  onClose,
  onResourceUpdated,
  onResourceDeleted,
  onEditListing,
  onNotify,
  onRequireLogin,
}) => {
  const [localResource, setLocalResource] = useState<Resource | null>(resource);
  const [otpInput, setOtpInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setLocalResource(resource);
    setOtpInput('');
    setActionError(null);
  }, [resource]);

  if (!localResource) return null;

  const hasRetailComparison =
    localResource.price > 0 && localResource.originalPrice > localResource.price;
  const discountPercent = hasRetailComparison
    ? Math.round(
        ((localResource.originalPrice - localResource.price) / localResource.originalPrice) * 100
      )
    : 0;
  const showAnnotationsBanner =
    localResource.category === 'Textbook' && localResource.handwrittenNotesIncluded;
  const status = localResource.status || 'Available';
  const activeRes = localResource.activeReservation;

  const isSeller = Boolean(
    currentUser &&
      ((localResource.seller.email &&
        currentUser.email.toLowerCase() === localResource.seller.email.toLowerCase()) ||
        currentUser.name.toLowerCase() === localResource.seller.name.toLowerCase())
  );
  const isReservingBuyer = Boolean(activeRes?.otpCode);

  const handleReserve = async () => {
    setActionError(null);

    if (!currentUser) {
      onRequireLogin();
      return;
    }

    if (!isBackendLive) {
      // Graceful offline fallback when backend server is not running
      const demoOtp = String(Math.floor(1000 + Math.random() * 9000));
      const updated: Resource = {
        ...localResource,
        status: 'Reserved',
        seller: {
          ...localResource.seller,
          phone: '+91 98765 43210',
          email: `${localResource.seller.name.toLowerCase().replace(/\s+/g, '.')}@mit.edu`,
          contactUnmasked: true,
        },
        activeReservation: {
          id: `demo-res-${Date.now()}`,
          buyerId: 'demo-buyer',
          buyerName: currentUser.name,
          status: 'Pending Handoff',
          otpCode: demoOtp,
          createdAt: new Date().toISOString(),
        },
      };
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FCE38A', '#F38181', '#4A3C31'],
      });
      setLocalResource(updated);
      onResourceUpdated(updated);
      onNotify(
        `Reserved "${localResource.title}" for ₹${localResource.price}!`,
        `Demo OTP: ${demoOtp} (Start backend server for live Supabase persistence).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await reserveResourceItem(localResource.id, currentUser);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FCE38A', '#F38181', '#4A3C31'],
      });
      setLocalResource(result.resource);
      onResourceUpdated(result.resource);
      onNotify(
        `Reserved "${localResource.title}" for ₹${localResource.price}!`,
        `Your live handover OTP is ${result.otpCode}. Seller contact has been unmasked.`
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reserve item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRes || !otpInput.trim()) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      const updated = await verifyResourceOtp(activeRes.id, otpInput.trim(), currentUser);
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#10b981', '#FCE38A', '#F38181'],
      });
      setLocalResource(updated);
      onResourceUpdated(updated);
      setOtpInput('');
      onNotify(
        `Handover Verified for "${localResource.title}"!`,
        'OTP matched. Item status updated to Handed Over in Supabase.'
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'OTP verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!activeRes) return;
    setActionError(null);

    if (!isBackendLive) {
      const updated: Resource = {
        ...localResource,
        status: 'Available',
        activeReservation: undefined,
      };
      setLocalResource(updated);
      onResourceUpdated(updated);
      onNotify('Reservation Cancelled', `"${localResource.title}" is available again.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await cancelResourceReservation(activeRes.id, currentUser);
      setLocalResource(updated);
      onResourceUpdated(updated);
      onNotify('Reservation Cancelled', `"${localResource.title}" has been released back to Available.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteListing = async () => {
    setActionError(null);
    setIsSubmitting(true);
    try {
      if (isBackendLive) {
        await deleteResourceListing(localResource.id, currentUser);
      }
      onResourceDeleted(localResource.id);
      onNotify('Listing Removed', `"${localResource.title}" was deleted from the catalog.`);
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#4A3C31]/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#F7F3EE] w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#EDE5D8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero */}
        <div className="relative h-56 sm:h-64 bg-[#EDE5D8] overflow-hidden shrink-0">
          <img
            src={localResource.image}
            alt={localResource.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/resources/res-1.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#4A3C31]/90 via-[#4A3C31]/30 to-transparent flex flex-col justify-between p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FCE38A] text-[#4A3C31] shadow-sm flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {localResource.category}
                </span>
                {status !== 'Available' && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                      status === 'Reserved'
                        ? 'bg-[#4A3C31] text-[#FCE38A]'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {status}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-[#4A3C31]/80 text-[#F7F3EE] hover:bg-[#4A3C31] transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-white">
              <span className="text-xs font-semibold text-[#FCE38A] tracking-wider uppercase block mb-1">
                {localResource.courseCode} · {localResource.department}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm">
                {localResource.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Pricing Bar */}
        <div className="bg-[#FCE38A] px-6 py-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE5D8]">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-2xl font-extrabold text-[#4A3C31]">
              {localResource.price === 0 ? 'Free' : `₹${localResource.price}`}
            </span>
            {hasRetailComparison && (
              <span className="text-sm line-through text-[#7A695C]">₹{localResource.originalPrice}</span>
            )}
            {hasRetailComparison && discountPercent > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 shadow-sm">
                Save {discountPercent}%
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-xl text-xs font-bold bg-[#ff1d1d] text-white shadow-sm">
              Available until {localResource.availableUntil}
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-[#4A3C31]/10 rounded-lg text-[#4A3C31]">
            Condition: {localResource.condition}
          </span>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {actionError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Textbook Annotations Banner */}
          {showAnnotationsBanner && (
            <div className="bg-[#FFF8DF] border border-[#FCE38A] rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#F38181] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#4A3C31]">
                  Textbook Has Senior Annotations
                </h4>
                <p className="text-xs sm:text-sm text-[#746356] mt-0.5">
                  Includes highlighted mid-term derivations, margin notes, and sticky-tab exam bookmarks.
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#746356] mb-2">
              Item Description & Context
            </h4>
            <p className="text-sm text-[#4A3C31] leading-relaxed bg-white p-4 rounded-2xl border border-[#EDE5D8]">
              {localResource.description}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-[#EDE5D8]">
              <span className="text-xs text-[#99897D] block">Edition / Model</span>
              <span className="font-bold text-xs sm:text-sm text-[#4A3C31]">{localResource.edition}</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-[#EDE5D8]">
              <span className="text-xs text-[#99897D] block">Target Course</span>
              <span className="font-bold text-xs sm:text-sm text-[#4A3C31]">{localResource.courseName}</span>
            </div>
          </div>

          {/* Senior Seller Info (Progressive Contact Disclosure) */}
          <div className="bg-white p-4 rounded-2xl border border-[#EDE5D8] space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#746356]">
              Senior Seller Information
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FCE38A] text-[#4A3C31] flex items-center justify-center font-bold">
                {localResource.seller.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h5 className="font-bold text-sm text-[#4A3C31]">{localResource.seller.name}</h5>
                  {localResource.seller.verified && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified Senior
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#746356]">
                  {localResource.seller.department} · {localResource.seller.year}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#EDE5D8]">
              <div className="flex items-center gap-2 text-xs text-[#4A3C31] bg-[#F7F3EE] px-3 py-2 rounded-xl">
                <Phone className="w-3.5 h-3.5 text-[#F38181] shrink-0" />
                <span className="font-medium">
                  {localResource.seller.phone || '+91 98765 •••••'}
                </span>
                {!localResource.seller.contactUnmasked && (
                  <span className="text-[10px] text-[#99897D] ml-auto">Unmasks on reserve</span>
                )}
              </div>
              {localResource.seller.contactUnmasked && localResource.seller.email && (
                <div className="flex items-center gap-2 text-xs text-[#4A3C31] bg-[#F7F3EE] px-3 py-2 rounded-xl">
                  <Mail className="w-3.5 h-3.5 text-[#F38181] shrink-0" />
                  <span className="font-medium truncate">{localResource.seller.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Pickup Location */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#EDE5D8] flex items-center gap-3 text-xs text-[#4A3C31]">
            <MapPin className="w-4 h-4 text-[#F38181] shrink-0" />
            <div>
              <span className="font-bold block">Campus Handover Spot:</span>
              <span className="text-[#746356]">{localResource.pickupLocation}</span>
            </div>
          </div>

          {/* Buyer View: Live OTP Escrow Box */}
          {status === 'Reserved' && isReservingBuyer && activeRes && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h5 className="font-bold text-xs text-emerald-800 uppercase tracking-wider">
                    Reservation Locked · Handover OTP:{' '}
                    <span className="text-base font-extrabold tracking-widest bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300 ml-1">
                      {activeRes.otpCode}
                    </span>
                  </h5>
                  <p className="text-xs text-emerald-700 mt-1.5">
                    Share this OTP with {localResource.seller.name} at{' '}
                    <strong>{localResource.pickupLocation}</strong> to verify the physical exchange.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCancelReservation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Cancel Reservation
                </button>
              </div>
            </div>
          )}

          {/* Seller View: Verify Buyer's OTP Form */}
          {status === 'Reserved' && isSeller && activeRes && (
            <form
              onSubmit={handleVerifyOtp}
              className="bg-[#FFF8DF] border border-[#FCE38A] rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-[#4A3C31] shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-wider text-[#4A3C31]">
                    Reserved by {activeRes.buyerName} · Verify Physical Handover
                  </h5>
                  <p className="text-xs text-[#746356] mt-0.5">
                    Ask {activeRes.buyerName} for their 4-digit OTP during campus pickup and enter it below to complete the exchange.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="Enter 4-digit OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="flex-1 min-w-[140px] px-3.5 py-2 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs font-bold tracking-widest text-[#4A3C31]"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Verify OTP
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCancelReservation}
                  className="px-3 py-2 rounded-xl bg-white border border-[#EDE5D8] text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Release Hold
                </button>
              </div>
            </form>
          )}

          {/* Completed Handover Banner */}
          {status === 'Handed Over' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <div className="text-xs text-emerald-800">
                <span className="font-bold block">Physical Handoff Completed</span>
                <span>This resource has been OTP-verified and transferred to a campus student.</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-6 bg-white border-t border-[#EDE5D8] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#746356]">Verified peer-to-peer campus exchange</span>
            {isSeller && status === 'Available' && onEditListing && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onEditListing(localResource)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#4A3C31] hover:text-[#F38181]"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            {isSeller && status === 'Available' && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteListing}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#D8CEBE] text-xs font-semibold text-[#4A3C31] hover:bg-[#F7F3EE] transition-colors"
            >
              Close
            </button>
            {status === 'Available' && !isSeller && (onAddToCart || onOpenCart) && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  if (isInCart) {
                    onClose();
                    onOpenCart?.();
                  } else {
                    onAddToCart?.(localResource);
                  }
                }}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 border ${
                  isInCart
                    ? 'bg-[#FCE38A] border-[#F0D372] text-[#4A3C31] hover:bg-[#FAD872]'
                    : 'bg-[#FFF8DF] border-[#FCE38A] text-[#4A3C31] hover:bg-[#FCE38A]'
                }`}
              >
                {isInCart ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    View in Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 text-[#F38181]" />
                    Add to Cart
                  </>
                )}
              </button>
            )}
            {status === 'Available' && !isSeller && (
              <button
                onClick={handleReserve}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#F38181] hover:bg-[#EA6E6E] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {isSubmitting ? 'Locking Item...' : 'Reserve for Campus Pickup'}
              </button>
            )}
            {status === 'Available' && isSeller && (
              <span className="px-4 py-2 rounded-xl bg-[#F7F3EE] text-xs font-bold text-[#746356]">
                Your Active Listing
              </span>
            )}
            {status === 'Reserved' && !isReservingBuyer && !isSeller && (
              <button
                disabled
                className="px-5 py-2.5 rounded-xl bg-[#EDE5D8] text-[#746356] text-xs sm:text-sm font-bold cursor-not-allowed"
              >
                Reserved by Another Student
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
