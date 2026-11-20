import React, { useEffect, useState } from 'react';
import {
  X,
  BookOpen,
  Upload,
  Calculator,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FairPriceEstimate, Resource, ResourceCategory, UserProfile } from '../types';
import {
  createResourceListing,
  estimateFairPriceApi,
  updateResourceListing,
} from '../api/resourcesApi';

interface PublishResourceModalProps {
  isOpen: boolean;
  resourceToEdit: Resource | null;
  currentUser: UserProfile | null;
  isBackendLive: boolean;
  onClose: () => void;
  onSaved: (resource: Resource, isEdit: boolean) => void;
  onRequireLogin: () => void;
}

const DEFAULT_AVAILABLE_UNTIL = '2026-05-25';

export const PublishResourceModal: React.FC<PublishResourceModalProps> = ({
  isOpen,
  resourceToEdit,
  currentUser,
  isBackendLive,
  onClose,
  onSaved,
  onRequireLogin,
}) => {
  const isEditMode = Boolean(resourceToEdit);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('Textbook');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [department, setDepartment] = useState(currentUser?.department || 'Computer Science');
  const [edition, setEdition] = useState('');
  const [condition, setCondition] = useState<Resource['condition']>('Like New');
  const [price, setPrice] = useState('450');
  const [hasAnnotations, setHasAnnotations] = useState(false);
  const [availableUntil, setAvailableUntil] = useState(DEFAULT_AVAILABLE_UNTIL);
  const [pickupLocation, setPickupLocation] = useState('Central Library Steps');
  const [description, setDescription] = useState('');

  // Photo upload & instant preview state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fair price estimate state (only referred to as "Fair Price" once calculated)
  const [fairPriceEstimate, setFairPriceEstimate] = useState<FairPriceEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (resourceToEdit) {
      setTitle(resourceToEdit.title);
      setCategory(resourceToEdit.category);
      setCourseCode(resourceToEdit.courseCode);
      setCourseName(resourceToEdit.courseName);
      setDepartment(resourceToEdit.department);
      setEdition(resourceToEdit.edition);
      setCondition(resourceToEdit.condition);
      setPrice(String(resourceToEdit.price));
      setHasAnnotations(
        resourceToEdit.category === 'Textbook' ? Boolean(resourceToEdit.handwrittenNotesIncluded) : false
      );
      setAvailableUntil(resourceToEdit.availableUntilIso || DEFAULT_AVAILABLE_UNTIL);
      setPickupLocation(resourceToEdit.pickupLocation);
      setDescription(resourceToEdit.description);
      setImageFile(null);
      setPreviewUrl(resourceToEdit.image);
    } else {
      setTitle('');
      setCategory('Textbook');
      setCourseCode('');
      setCourseName('');
      setDepartment(currentUser?.department || 'Computer Science');
      setEdition('');
      setCondition('Like New');
      setPrice('450');
      setHasAnnotations(false);
      setAvailableUntil(DEFAULT_AVAILABLE_UNTIL);
      setPickupLocation('Central Library Steps');
      setDescription('');
      setImageFile(null);
      setPreviewUrl(null);
    }

    setFairPriceEstimate(null);
    setError(null);
  }, [isOpen, resourceToEdit, currentUser]);

  // Clean up object URLs on unmount or replacement
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const isTextbook = category === 'Textbook';

  const handleCategoryChange = (nextCategory: ResourceCategory) => {
    setCategory(nextCategory);
    setFairPriceEstimate(null);
    if (nextCategory !== 'Textbook') {
      setHasAnnotations(false);
      if (condition === 'Annotated with Exam Notes') {
        setCondition('Gently Used');
      }
    }
  };

  const handleFileSelected = (file: File | null) => {
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please select a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file must be under 5 MB.');
      return;
    }
    setError(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleEstimateFairPrice = async () => {
    setError(null);
    setIsEstimating(true);
    try {
      if (isBackendLive) {
        const estimate = await estimateFairPriceApi({
          category,
          course_code: courseCode.trim() || 'GENERAL',
          condition,
          notes_included: isTextbook && hasAnnotations,
        });
        setFairPriceEstimate(estimate);
      } else {
        // Offline formula matching backend pricing.service.ts
        const baselines: Record<ResourceCategory, number> = {
          Textbook: 1400,
          Electronics: 1500,
          'Lab Equipment': 1100,
          'Study Notes': 450,
          'Hostel Essentials': 900,
        };
        const mult =
          condition === 'Like New'
            ? 0.65
            : condition === 'Annotated with Exam Notes' && isTextbook
              ? 0.6
              : 0.45;
        let rec = (baselines[category] || 1000) * mult;
        if (isTextbook && hasAnnotations) rec *= 1.1;
        const recommended = Math.max(50, Math.round(rec));
        setFairPriceEstimate({
          recommended_price: recommended,
          min_fair_price: Math.max(50, Math.round(recommended * 0.85)),
          max_fair_price: Math.round(recommended * 1.15),
          historical_avg_price: null,
          sample_count: 0,
          basis: `Offline ${category} estimate (${Math.round(mult * 100)}% condition factor)`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to estimate fair price.');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      onRequireLogin();
      return;
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      setError('Please enter a valid price (₹0 or higher).');
      return;
    }

    const finalDescription =
      description.trim() ||
      `${condition} ${category.toLowerCase()} for ${courseCode.trim().toUpperCase() || 'campus coursework'}. Available for direct student pickup.`;

    const payload = {
      title: title.trim(),
      category,
      price: Math.round(numericPrice),
      condition: !isTextbook && condition === 'Annotated with Exam Notes' ? 'Gently Used' : condition,
      courseCode: courseCode.trim().toUpperCase() || 'GENERAL',
      courseName: courseName.trim() || 'Campus Academic Material',
      department,
      edition: edition.trim() || 'Standard Edition',
      pickupLocation: pickupLocation.trim() || 'Central Library Steps',
      description: finalDescription,
      handwrittenNotesIncluded: isTextbook ? hasAnnotations : false,
      availableUntil,
    };

    setIsSubmitting(true);
    try {
      let saved: Resource;

      if (isBackendLive) {
        if (isEditMode && resourceToEdit) {
          saved = await updateResourceListing(resourceToEdit.id, payload, currentUser, imageFile);
        } else {
          saved = await createResourceListing(payload, currentUser, imageFile);
        }
      } else {
        const displayDate = new Date(`${availableUntil}T00:00:00`).toLocaleDateString('en-US', {
          month: 'long',
          day: '2-digit',
          year: 'numeric',
        });
        saved = {
          ...(resourceToEdit || {}),
          id: resourceToEdit?.id || `local-${Date.now()}`,
          ...payload,
          originalPrice: resourceToEdit?.originalPrice || Math.max(1, payload.price),
          image: previewUrl || resourceToEdit?.image || '/images/resources/res-1.jpg',
          availableUntil: displayDate,
          availableUntilIso: availableUntil,
          status: resourceToEdit?.status || 'Available',
          seller: resourceToEdit?.seller || {
            name: currentUser.name,
            year: currentUser.year,
            department: currentUser.department,
            verified: true,
            email: currentUser.email,
            phone: currentUser.phone || '+91 98765 43210',
            contactUnmasked: true,
          },
        };
      }

      if (!isEditMode) {
        confetti({
          particleCount: 85,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FCE38A', '#F38181', '#4A3C31'],
        });
      }

      onSaved(saved, isEditMode);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#4A3C31]/65 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#F7F3EE] w-full max-w-2xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#EDE5D8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#FCE38A] p-5 sm:p-6 flex items-center justify-between border-b border-[#EDE5D8]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#4A3C31] text-[#FCE38A] rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#4A3C31]">
                {isEditMode ? 'Edit Resource Listing' : 'Sell / List an Academic Resource'}
              </h3>
              <p className="text-xs text-[#746356]">
                {isEditMode
                  ? 'Update price, availability date, details, or replace photo'
                  : 'List textbooks, calculators, lab kits, or hostel essentials directly for peers'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Photo Upload with Live Preview */}
          <div className="bg-white p-4 rounded-2xl border border-[#EDE5D8]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#746356] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#F38181]" />
                Item Photo (Smartphone Camera)
              </label>
              <span className="text-[10px] text-[#99897D]">JPEG, PNG, WebP · Max 5 MB</span>
            </div>

            {previewUrl ? (
              <div className="relative h-44 rounded-2xl overflow-hidden bg-[#EDE5D8] border border-[#EDE5D8]">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-[#4A3C31]/90 hover:bg-[#4A3C31] text-[#F7F3EE] text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    Replace Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
                    />
                  </label>
                  {imageFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setPreviewUrl(resourceToEdit?.image || null);
                      }}
                      className="p-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-sm"
                      title="Remove selected image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <label className="h-32 rounded-2xl bg-[#F7F3EE] border-2 border-dashed border-[#D8CEBE] hover:border-[#F38181] transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center px-4">
                <Upload className="w-6 h-6 text-[#F38181]" />
                <span className="text-xs font-bold text-[#4A3C31]">
                  Click to upload a photo of your item
                </span>
                <span className="text-[11px] text-[#746356]">
                  Uploaded securely to Supabase Storage CDN
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#4A3C31] block mb-1">
                Item Title <span className="text-[#F38181]">*</span>
              </label>
              <input
                type="text"
                required
                minLength={3}
                placeholder="e.g. Operating System Concepts (10th Edition)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as ResourceCategory)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
              >
                <option value="Textbook">Textbook</option>
                <option value="Electronics">Electronics</option>
                <option value="Lab Equipment">Lab Equipment</option>
                <option value="Study Notes">Study Notes</option>
                <option value="Hostel Essentials">Hostel Essentials</option>
              </select>
            </div>
          </div>

          {/* Course & Department Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Course Code</label>
              <input
                type="text"
                placeholder="e.g. CS302"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Course Name</label>
              <input
                type="text"
                placeholder="e.g. Operating Systems"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
              >
                <option>Computer Science</option>
                <option>Electrical & Electronics</option>
                <option>Data Science & AI</option>
                <option>Mechanical Engineering</option>
                <option>Biotechnology</option>
                <option>Civil Engineering</option>
                <option>All Engineering Disciplines</option>
                <option>Hostel Life</option>
              </select>
            </div>
          </div>

          {/* Condition, Price, and Available Until */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => {
                  setCondition(e.target.value as Resource['condition']);
                  setFairPriceEstimate(null);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
              >
                <option value="Like New">Like New</option>
                {isTextbook && (
                  <option value="Annotated with Exam Notes">Annotated with Exam Notes</option>
                )}
                <option value="Gently Used">Gently Used</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#4A3C31] block mb-1">
                Price (₹) <span className="text-[#F38181]">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                max={100000}
                placeholder="450"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs font-bold text-[#4A3C31]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#4A3C31] block mb-1">
                Available Until <span className="text-[#ff1d1d]">*</span>
              </label>
              <input
                type="date"
                required
                value={availableUntil}
                onChange={(e) => setAvailableUntil(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
              />
            </div>
          </div>

          {/* Conditional "Has Annotations" Checkbox (ONLY for Textbooks) + Fair Price Calculator */}
          <div className="bg-[#FFF8DF] border border-[#FCE38A] rounded-2xl p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {isTextbook ? (
                <label className="flex items-center gap-2 text-xs font-semibold text-[#4A3C31] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAnnotations}
                    onChange={(e) => {
                      setHasAnnotations(e.target.checked);
                      setFairPriceEstimate(null);
                    }}
                    className="w-4 h-4 rounded accent-[#F38181]"
                  />
                  <span>Has Annotations (margin notes, highlights, or exam tabs)</span>
                </label>
              ) : (
                <span className="text-xs text-[#746356]">
                  Unsure what to price this {category.toLowerCase()}?
                </span>
              )}

              <button
                type="button"
                disabled={isEstimating}
                onClick={handleEstimateFairPrice}
                className="px-3 py-1.5 rounded-xl bg-[#4A3C31] hover:bg-[#32271E] text-[#FCE38A] text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
              >
                {isEstimating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Calculator className="w-3.5 h-3.5" />
                )}
                Estimate Fair Price
              </button>
            </div>

            {fairPriceEstimate && (
              <div className="pt-2.5 border-t border-[#FCE38A] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-[#4A3C31]">
                    Estimated Fair Price: ₹{fairPriceEstimate.recommended_price}
                  </span>{' '}
                  <span className="text-[#746356]">
                    (Fair band: ₹{fairPriceEstimate.min_fair_price} – ₹{fairPriceEstimate.max_fair_price})
                  </span>
                  <span className="block text-[11px] text-[#746356] mt-0.5">
                    {fairPriceEstimate.basis}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPrice(String(fairPriceEstimate.recommended_price))}
                  className="px-3 py-1.5 rounded-xl bg-[#F38181] hover:bg-[#EA6E6E] text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Apply Fair Price (₹{fairPriceEstimate.recommended_price})
                </button>
              </div>
            )}
          </div>

          {/* Edition & Pickup Spot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4A3C31] block mb-1">
                Edition / Model Details
              </label>
              <input
                type="text"
                placeholder="e.g. 4th Edition Hardcover / FX-991EX"
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#4A3C31] block mb-1">
                Campus Pickup Spot <span className="text-[#F38181]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Central Library Steps or Gate 2"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[#4A3C31] block mb-1">
              Description <span className="text-[#F38181]">*</span>
            </label>
            <textarea
              rows={3}
              required
              minLength={10}
              placeholder="Describe item condition, included accessories, or chapters covered..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31] resize-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#D8CEBE] text-xs font-semibold text-[#4A3C31] hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#F38181] hover:bg-[#EA6E6E] disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {isSubmitting
                  ? isEditMode
                    ? 'Saving Changes...'
                    : 'Publishing...'
                  : isEditMode
                    ? 'Save Listing Changes'
                    : 'Publish Resource'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
