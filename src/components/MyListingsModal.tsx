import React, { useState } from 'react';
import { MyListingsSummary, Resource, UserProfile } from '../types';
import {
  X,
  Package,
  Pencil,
  Trash2,
  KeyRound,
  CheckCircle2,
  Plus,
  Loader2,
  AlertCircle,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  cancelResourceReservation,
  deleteResourceListing,
  verifyResourceOtp,
} from '../api/resourcesApi';

interface MyListingsModalProps {
  isOpen: boolean;
  items: Resource[];
  summary: MyListingsSummary;
  currentUser: UserProfile | null;
  isBackendLive: boolean;
  onClose: () => void;
  onOpenPublishNew: () => void;
  onEditResource: (resource: Resource) => void;
  onResourceUpdated: (updated: Resource) => void;
  onResourceDeleted: (id: string) => void;
  onNotify: (message: string, subtext?: string) => void;
}

type ListingFilter = 'All' | 'Available' | 'Reserved' | 'Handed Over';

export const MyListingsModal: React.FC<MyListingsModalProps> = ({
  isOpen,
  items,
  summary,
  currentUser,
  isBackendLive,
  onClose,
  onOpenPublishNew,
  onEditResource,
  onResourceUpdated,
  onResourceDeleted,
  onNotify,
}) => {
  const [filter, setFilter] = useState<ListingFilter>('All');
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    const status = item.status || 'Available';
    if (filter === 'All') return true;
    return status === filter;
  });

  const handleVerifyOtp = async (item: Resource) => {
    const resId = item.activeReservation?.id;
    const otp = (otpInputs[item.id] || '').trim();
    if (!resId || !otp) {
      setError('Please enter the 4-digit OTP shared by the buyer.');
      return;
    }

    setError(null);
    setBusyId(item.id);
    try {
      const updated = await verifyResourceOtp(resId, otp, currentUser);
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#FCE38A', '#F38181'],
      });
      onResourceUpdated(updated);
      setOtpInputs((prev) => ({ ...prev, [item.id]: '' }));
      onNotify(
        `Handover Verified for "${item.title}"!`,
        'OTP matched. Item is now marked as Handed Over.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReleaseHold = async (item: Resource) => {
    const resId = item.activeReservation?.id;
    if (!resId) return;

    setError(null);
    setBusyId(item.id);
    try {
      const updated = isBackendLive
        ? await cancelResourceReservation(resId, currentUser)
        : { ...item, status: 'Available' as const, activeReservation: undefined };
      onResourceUpdated(updated);
      onNotify('Reservation Released', `"${item.title}" is available for other students again.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to release reservation.');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async (item: Resource) => {
    setError(null);
    setBusyId(item.id);
    try {
      if (isBackendLive) {
        await deleteResourceListing(item.id, currentUser);
      }
      onResourceDeleted(item.id);
      setConfirmDeleteId(null);
      onNotify('Listing Deleted', `"${item.title}" has been removed.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete listing.');
    } finally {
      setBusyId(null);
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
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#4A3C31]">My Resource Listings</h3>
              <p className="text-xs text-[#746356]">
                Manage your posted items, edit prices, and verify buyer pickup OTPs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPublishNew();
              }}
              className="px-3.5 py-2 rounded-xl bg-[#F38181] hover:bg-[#EA6E6E] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List New Item</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#4A3C31]/80 text-[#F7F3EE] hover:bg-[#4A3C31] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary Metrics Bar */}
        <div className="grid grid-cols-3 gap-3 px-6 pt-5 pb-3">
          <div className="bg-white rounded-2xl p-3 border border-[#EDE5D8] text-center">
            <div className="text-lg font-extrabold text-[#4A3C31]">{summary.available}</div>
            <div className="text-[11px] font-semibold text-[#746356]">Available</div>
          </div>
          <div className="bg-[#FFF8DF] rounded-2xl p-3 border border-[#FCE38A] text-center">
            <div className="text-lg font-extrabold text-[#F38181]">{summary.pendingOtpCount}</div>
            <div className="text-[11px] font-semibold text-[#4A3C31]">Pending OTP</div>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 text-center">
            <div className="text-lg font-extrabold text-emerald-700">{summary.handedOver}</div>
            <div className="text-[11px] font-semibold text-emerald-800">Handed Over</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pb-3 flex items-center gap-1.5 overflow-x-auto border-b border-[#EDE5D8]">
          {(
            [
              { key: 'All', label: `All (${summary.total})` },
              { key: 'Available', label: `Available (${summary.available})` },
              { key: 'Reserved', label: `Pending OTP (${summary.reserved})` },
              { key: 'Handed Over', label: `Completed (${summary.handedOver})` },
            ] as Array<{ key: ListingFilter; label: string }>
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

        {/* Listings List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#EDE5D8] space-y-3">
              <Package className="w-10 h-10 text-[#D8CEBE] mx-auto" />
              <p className="text-sm font-bold text-[#4A3C31]">
                {filter === 'All'
                  ? "You haven't listed any academic resources yet."
                  : `No listings with status "${filter}".`}
              </p>
              <p className="text-xs text-[#746356]">
                Pass down textbooks, calculators, or lab kits to incoming juniors before you graduate.
              </p>
              {filter === 'All' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPublishNew();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F38181] hover:bg-[#EA6E6E] text-white text-xs font-bold shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Sell / List Your First Item
                </button>
              )}
            </div>
          ) : (
            filteredItems.map((item) => {
              const status = item.status || 'Available';
              const isBusy = busyId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-[#EDE5D8] space-y-3 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Thumbnail */}
                    <div className="w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-[#EDE5D8] shrink-0">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/resources/res-1.jpg';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#FCE38A] text-[#4A3C31]">
                              {item.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#F7F3EE] text-[#4A3C31]">
                              {item.courseCode}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                status === 'Available'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : status === 'Reserved'
                                    ? 'bg-[#4A3C31] text-[#FCE38A]'
                                    : 'bg-emerald-700 text-white'
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-[#4A3C31] truncate">{item.title}</h4>
                        </div>
                        <div className="text-base font-extrabold text-[#4A3C31] shrink-0">
                          {item.price === 0 ? 'Free' : `₹${item.price}`}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#746356] mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[#ff1d1d] font-semibold">
                          <Calendar className="w-3 h-3" />
                          Available until {item.availableUntil}
                        </span>
                        <span>•</span>
                        <span>{item.condition}</span>
                      </div>

                      {/* Available Item Actions */}
                      {status === 'Available' && (
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-[#EDE5D8]">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => onEditResource(item)}
                            className="px-3 py-1.5 rounded-xl bg-[#F7F3EE] hover:bg-[#FCE38A] text-[#4A3C31] text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit Listing
                          </button>

                          {confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleConfirmDelete(item)}
                                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1"
                              >
                                {isBusy && <Loader2 className="w-3 h-3 animate-spin" />}
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2.5 py-1.5 rounded-xl bg-[#F7F3EE] text-[#746356] text-xs font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setConfirmDeleteId(item.id)}
                              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          )}
                        </div>
                      )}

                      {/* Completed Status */}
                      {status === 'Handed Over' && (
                        <div className="mt-3 pt-2.5 border-t border-[#EDE5D8] flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>OTP Verified & Handed Over</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reserved Item: Inline Buyer OTP Verification Box */}
                  {status === 'Reserved' && item.activeReservation && (
                    <div className="bg-[#FFF8DF] border border-[#FCE38A] rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#4A3C31]">
                        <KeyRound className="w-4 h-4 text-[#F38181] shrink-0" />
                        <span>
                          Reserved by {item.activeReservation.buyerName} — Enter buyer&apos;s 4-digit OTP at pickup:
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 4-digit OTP"
                          value={otpInputs[item.id] || ''}
                          onChange={(e) =>
                            setOtpInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          className="flex-1 min-w-[140px] px-3 py-2 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs font-bold tracking-widest text-[#4A3C31]"
                        />
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleVerifyOtp(item)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Verify OTP
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleReleaseHold(item)}
                          className="px-3 py-2 rounded-xl bg-white border border-[#EDE5D8] text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Release Hold
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
