import React, { useEffect, useState } from 'react';
import {
  X,
  Home,
  BookOpen,
  UserCheck,
  Sparkles,
  CheckCircle2,
  Calculator,
  Upload,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FairPriceEstimate, Resource, ResourceCategory, UserProfile } from '../types';
import { createResourceListing, estimateFairPriceApi } from '../api/resourcesApi';

interface ListHandoffModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  isBackendLive: boolean;
  onClose: () => void;
  onSubmitHandoff: (summary: string, createdResource?: Resource) => void;
  onRequireLogin: () => void;
}

export const ListHandoffModal: React.FC<ListHandoffModalProps> = ({
  isOpen,
  currentUser,
  isBackendLive,
  onClose,
  onSubmitHandoff,
  onRequireLogin,
}) => {
  const [seniorName, setSeniorName] = useState(currentUser?.name || '');
  const [department, setDepartment] = useState(currentUser?.department || 'Computer Science');
  const [vacantDate, setVacantDate] = useState('2026-05-15');

  // Room module fields
  const [hasRoom, setHasRoom] = useState(false);
  const [roomTitle, setRoomTitle] = useState('');
  const [rent, setRent] = useState('8000');

  // Resource Exchange module fields (connected to live backend)
  const [hasResource, setHasResource] = useState(true);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceCategory, setResourceCategory] = useState<ResourceCategory>('Textbook');
  const [courseCode, setCourseCode] = useState('CS302');
  const [courseName, setCourseName] = useState('Operating Systems');
  const [resourceCondition, setResourceCondition] =
    useState<Resource['condition']>('Like New');
  const [resourcePrice, setResourcePrice] = useState('500');
  const [hasAnnotations, setHasAnnotations] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('Central Library Steps');
  const [resourceDescription, setResourceDescription] = useState('');
  const [availableUntil, setAvailableUntil] = useState('2026-05-25');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Fair-price estimator state
  const [priceEstimate, setPriceEstimate] = useState<FairPriceEstimate | null>(null);
  const [estimatingPrice, setEstimatingPrice] = useState(false);

  // Mentorship module fields
  const [hasMentorship, setHasMentorship] = useState(false);
  const [mentorshipTopic, setMentorshipTopic] = useState('Course Guidance & Lab Survival');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setSeniorName(currentUser.name);
      if (currentUser.department) setDepartment(currentUser.department);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const isTextbook = resourceCategory === 'Textbook';

  const handleCategoryChange = (nextCategory: ResourceCategory) => {
    setResourceCategory(nextCategory);
    setPriceEstimate(null);
    if (nextCategory !== 'Textbook') {
      setHasAnnotations(false);
      if (resourceCondition === 'Annotated with Exam Notes') {
        setResourceCondition('Gently Used');
      }
    }
  };

  const handleEstimatePrice = async () => {
    setSubmitError(null);
    setEstimatingPrice(true);
    try {
      if (isBackendLive) {
        const estimate = await estimateFairPriceApi({
          category: resourceCategory,
          course_code: courseCode || 'GENERAL',
          condition: resourceCondition,
          notes_included: isTextbook && hasAnnotations,
        });
        setPriceEstimate(estimate);
      } else {
        const baselines: Record<ResourceCategory, number> = {
          Textbook: 1400,
          Electronics: 1500,
          'Lab Equipment': 1100,
          'Study Notes': 450,
          'Hostel Essentials': 900,
        };
        const mult =
          resourceCondition === 'Like New'
            ? 0.65
            : resourceCondition === 'Annotated with Exam Notes' && isTextbook
              ? 0.6
              : 0.45;
        let rec = (baselines[resourceCategory] || 1000) * mult;
        if (isTextbook && hasAnnotations) rec *= 1.1;
        const recommended = Math.max(50, Math.round(rec));
        setPriceEstimate({
          recommended_price: recommended,
          min_fair_price: Math.max(50, Math.round(recommended * 0.85)),
          max_fair_price: Math.round(recommended * 1.15),
          historical_avg_price: null,
          sample_count: 0,
          basis: `Offline ${resourceCategory} estimate (connect backend for historical campus averages)`,
        });
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to calculate price estimate.');
    } finally {
      setEstimatingPrice(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (hasResource && !currentUser) {
      onRequireLogin();
      return;
    }

    if (hasResource && !resourceTitle.trim()) {
      setSubmitError('Please provide a Material Name for your resource listing.');
      return;
    }

    setIsSubmitting(true);
    try {
      let createdResource: Resource | undefined;

      if (hasResource) {
        const descriptionText =
          resourceDescription.trim() ||
          `Well-maintained ${resourceCategory.toLowerCase()} for ${courseCode.toUpperCase()} (${courseName}). Passed down directly on campus.`;

        if (isBackendLive) {
          createdResource = await createResourceListing(
            {
              title: resourceTitle.trim(),
              category: resourceCategory,
              price: Number(resourcePrice) || 0,
              condition:
                !isTextbook && resourceCondition === 'Annotated with Exam Notes'
                  ? 'Gently Used'
                  : resourceCondition,
              courseCode: courseCode.trim() || 'GENERAL',
              courseName: courseName.trim() || 'General Academic Course',
              department,
              edition: 'Student Verified Edition',
              pickupLocation: pickupLocation.trim() || 'Central Library Steps',
              description: descriptionText,
              handwrittenNotesIncluded: isTextbook ? hasAnnotations : false,
              availableUntil,
            },
            currentUser,
            imageFile
          );
        } else {
          // Offline fallback so form still works without backend running
          const displayDate = new Date(`${availableUntil}T00:00:00`).toLocaleDateString('en-US', {
            month: 'long',
            day: '2-digit',
            year: 'numeric',
          });
          const numericPrice = Number(resourcePrice) || 0;
          createdResource = {
            id: `local-${Date.now()}`,
            title: resourceTitle.trim(),
            category: resourceCategory,
            price: numericPrice,
            originalPrice: Math.max(1, numericPrice),
            condition:
              !isTextbook && resourceCondition === 'Annotated with Exam Notes'
                ? 'Gently Used'
                : resourceCondition,
            image: '/images/resources/res-1.jpg',
            courseCode: courseCode.trim().toUpperCase() || 'GENERAL',
            courseName: courseName.trim() || 'General Academic Course',
            department,
            seller: {
              name: seniorName || currentUser?.name || 'Senior Student',
              year: currentUser?.year || 'Final Year Senior',
              department,
              verified: true,
              email: currentUser?.email,
              contactUnmasked: true,
            },
            pickupLocation: pickupLocation.trim() || 'Central Library Steps',
            description: descriptionText,
            handwrittenNotesIncluded: isTextbook ? hasAnnotations : false,
            edition: 'Student Verified Edition',
            availableUntil: displayDate,
            availableUntilIso: availableUntil,
            status: 'Available',
          };
        }
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FCE38A', '#F38181', '#4A3C31'],
      });

      const summary = createdResource
        ? `"${createdResource.title}" published ${isBackendLive ? 'to Supabase' : 'locally'} (Available until ${createdResource.availableUntil}).`
        : `${seniorName || 'Senior'} listed their handoff items for ${vacantDate}`;

      onSubmitHandoff(summary, createdResource);
      setResourceTitle('');
      setResourceDescription('');
      setImageFile(null);
      setPriceEstimate(null);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to publish handoff listing.');
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
        <div className="bg-[#FCE38A] p-5 sm:p-6 flex items-center justify-between border-b border-[#EDE5D8]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#4A3C31] text-[#FCE38A] rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#4A3C31]">Graduating Senior Handoff Hub</h3>
              <p className="text-xs text-[#746356]">
                Synchronize your departure: academic resources, room vacancy & mentorship
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#4A3C31]/80 text-[#F7F3EE] hover:bg-[#4A3C31] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Senior Profile */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#746356]">
              Your Academic Standing
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Sharma"
                  value={seniorName}
                  onChange={(e) => setSeniorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
                >
                  <option>Computer Science</option>
                  <option>Electrical & Electronics</option>
                  <option>Mechanical Engineering</option>
                  <option>Data Science & AI</option>
                  <option>Biotechnology</option>
                  <option>Civil Engineering</option>
                </select>
              </div>
            </div>
          </div>

          {/* Academic Resource Section (Live Supabase Backend Wired) */}
          <div className="bg-white p-4 rounded-2xl border border-[#EDE5D8] space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#4A3C31]">
                <input
                  type="checkbox"
                  checked={hasResource}
                  onChange={(e) => setHasResource(e.target.checked)}
                  className="w-4 h-4 rounded text-[#F38181] accent-[#F38181]"
                />
                <BookOpen className="w-4 h-4 text-[#F38181]" />
                List textbook / academic material for exchange
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {isBackendLive ? 'Live DB Sync' : 'Local Demo'}
              </span>
            </div>

            {hasResource && (
              <div className="space-y-3 pt-3 border-t border-[#EDE5D8]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#746356] block mb-1">
                      Material Name <span className="text-[#F38181]">*</span>
                    </label>
                    <input
                      type="text"
                      required={hasResource}
                      placeholder="e.g. Operating System Concepts (Silberschatz)"
                      value={resourceTitle}
                      onChange={(e) => setResourceTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#746356] block mb-1">Category</label>
                    <select
                      value={resourceCategory}
                      onChange={(e) => handleCategoryChange(e.target.value as ResourceCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                    >
                      <option value="Textbook">Textbook</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Lab Equipment">Lab Equipment</option>
                      <option value="Study Notes">Study Notes</option>
                      <option value="Hostel Essentials">Hostel Essentials</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#746356] block mb-1">Course Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CS302"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#746356] block mb-1">Course Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Operating Systems"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-[#746356] block mb-1">
                      Available Until <span className="text-[#ff1d1d]">*</span>
                    </label>
                    <input
                      type="date"
                      required={hasResource}
                      value={availableUntil}
                      onChange={(e) => setAvailableUntil(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#746356] block mb-1">Condition</label>
                    <select
                      value={resourceCondition}
                      onChange={(e) => {
                        setResourceCondition(e.target.value as Resource['condition']);
                        setPriceEstimate(null);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                    >
                      <option value="Like New">Like New</option>
                      {isTextbook && (
                        <option value="Annotated with Exam Notes">Annotated with Exam Notes</option>
                      )}
                      <option value="Gently Used">Gently Used</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#746356] block mb-1">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="500"
                      value={resourcePrice}
                      onChange={(e) => setResourcePrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                    />
                  </div>
                </div>

                {/* Fair-Price Estimator Widget */}
                <div className="bg-[#FFF8DF] border border-[#FCE38A] rounded-2xl p-3.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {isTextbook ? (
                      <label className="flex items-center gap-2 text-xs font-semibold text-[#4A3C31] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasAnnotations}
                          onChange={(e) => {
                            setHasAnnotations(e.target.checked);
                            setPriceEstimate(null);
                          }}
                          className="accent-[#F38181]"
                        />
                        <span>Has Annotations (notes, highlights, or exam tabs)</span>
                      </label>
                    ) : (
                      <span className="text-xs text-[#746356]">
                        Need help pricing this {resourceCategory.toLowerCase()}?
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={estimatingPrice}
                      onClick={handleEstimatePrice}
                      className="px-3 py-1.5 rounded-xl bg-[#4A3C31] hover:bg-[#32271E] text-[#FCE38A] text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {estimatingPrice ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Calculator className="w-3.5 h-3.5" />
                      )}
                      Estimate Fair Price
                    </button>
                  </div>

                  {priceEstimate && (
                    <div className="pt-2 border-t border-[#FCE38A] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-[#4A3C31]">
                          Estimated Fair Price: ₹{priceEstimate.recommended_price}
                        </span>{' '}
                        <span className="text-[#746356]">
                          (Fair band: ₹{priceEstimate.min_fair_price} – ₹{priceEstimate.max_fair_price})
                        </span>
                        <span className="block text-[11px] text-[#746356] mt-0.5">
                          {priceEstimate.basis}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResourcePrice(String(priceEstimate.recommended_price))}
                        className="px-2.5 py-1 rounded-lg bg-[#F38181] text-white font-bold text-[11px] hover:bg-[#EA6E6E]"
                      >
                        Apply Fair Price (₹{priceEstimate.recommended_price})
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#746356] block mb-1">
                      Campus Pickup Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Central Library Steps"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#746356] block mb-1">
                      Photo Upload (Optional)
                    </label>
                    <label className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-dashed border-[#D8CEBE] hover:border-[#F38181] text-xs text-[#746356] flex items-center gap-2 cursor-pointer truncate">
                      <Upload className="w-3.5 h-3.5 text-[#F38181] shrink-0" />
                      <span className="truncate">
                        {imageFile ? imageFile.name : 'Choose smartphone photo (.jpg/.png)'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#746356] block mb-1">
                    Brief Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Mention edition, highlights, or accessories included..."
                    value={resourceDescription}
                    onChange={(e) => setResourceDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31] resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Accommodation Vacancy Section */}
          <div className="bg-white p-4 rounded-2xl border border-[#EDE5D8] space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#4A3C31]">
                <input
                  type="checkbox"
                  checked={hasRoom}
                  onChange={(e) => setHasRoom(e.target.checked)}
                  className="w-4 h-4 rounded text-[#F38181] accent-[#F38181]"
                />
                <Home className="w-4 h-4 text-[#F38181]" />
                Also flag a vacating room/apartment
              </label>
            </div>

            {hasRoom && (
              <div className="space-y-3 pt-2 border-t border-[#EDE5D8]">
                <div>
                  <label className="text-xs font-semibold text-[#746356] block mb-1">
                    Room Vacancy Date
                  </label>
                  <input
                    type="date"
                    value={vacantDate}
                    onChange={(e) => setVacantDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#746356] block mb-1">Room Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Single Room, Block 4"
                      value={roomTitle}
                      onChange={(e) => setRoomTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#746356] block mb-1">Monthly Rent (₹)</label>
                    <input
                      type="number"
                      placeholder="8000"
                      value={rent}
                      onChange={(e) => setRent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mentorship Section */}
          <div className="bg-white p-4 rounded-2xl border border-[#EDE5D8] space-y-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#4A3C31]">
              <input
                type="checkbox"
                checked={hasMentorship}
                onChange={(e) => setHasMentorship(e.target.checked)}
                className="w-4 h-4 rounded text-[#F38181] accent-[#F38181]"
              />
              <UserCheck className="w-4 h-4 text-[#F38181]" />
              Offer 1-on-1 Guidance Slot to incoming juniors
            </label>

            {hasMentorship && (
              <div className="pt-2 border-t border-[#EDE5D8]">
                <label className="text-xs font-semibold text-[#746356] block mb-1">Guidance Topic</label>
                <input
                  type="text"
                  value={mentorshipTopic}
                  onChange={(e) => setMentorshipTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-[#F38181] hover:bg-[#EA6E6E] disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {isSubmitting ? 'Publishing to Database...' : 'Publish Unified Senior Departure Handoff'}
          </button>
        </form>
      </div>
    </div>
  );
};
