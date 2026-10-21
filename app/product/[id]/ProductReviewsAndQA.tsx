'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  isBuyer: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Question {
  id: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ProductReviewsAndQAProps {
  productId: string;
  artistUserId?: string;
}

export default function ProductReviewsAndQA({ productId, artistUserId }: ProductReviewsAndQAProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'reviews' | 'qa'>('reviews');

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [hasPurchased, setHasPurchased] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Review submission state
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Q&A state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [qaMsg, setQaMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Answering state (for artist/admin)
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const isArtistOrAdmin = session?.user?.id === artistUserId || (session?.user as any)?.role === 'ADMIN';

  // Load reviews
  const loadReviews = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setAvgRating(data.avgRating || 0);
        setTotalReviews(data.totalReviews || 0);
        setRatingDistribution(data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
        setHasPurchased(Boolean(data.hasPurchased));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Load questions
  const loadQuestions = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/questions`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setQuestionsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    loadQuestions();
  }, [productId, session]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    setReviewMsg(null);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: selectedRating, comment: reviewComment })
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewMsg({ type: 'error', text: data.error || 'خطا در ثبت نظر' });
      } else {
        setReviewMsg({ type: 'success', text: data.message });
        setReviewComment('');
        loadReviews();
      }
    } catch (e) {
      setReviewMsg({ type: 'error', text: 'خطا در برقراری ارتباط' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setSubmittingQuestion(true);
    setQaMsg(null);
    try {
      const res = await fetch(`/api/products/${productId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion })
      });
      const data = await res.json();
      if (!res.ok) {
        setQaMsg({ type: 'error', text: data.error || 'خطا در ارسال پرسش' });
      } else {
        setQaMsg({ type: 'success', text: data.message });
        setNewQuestion('');
        loadQuestions();
      }
    } catch (e) {
      setQaMsg({ type: 'error', text: 'خطا در برقراری ارتباط' });
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleAnswerQuestion = async (questionId: string) => {
    if (!answerText.trim()) return;

    setSubmittingAnswer(true);
    try {
      const res = await fetch(`/api/products/${productId}/questions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answer: answerText })
      });
      if (res.ok) {
        setAnsweringQuestionId(null);
        setAnswerText('');
        loadQuestions();
      } else {
        alert('خطا در ثبت پاسخ');
      }
    } catch (e) {
      alert('خطا در ثبت پاسخ');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = interactive 
            ? (hoverRating || selectedRating) >= star 
            : rating >= star;

          return (
            <button
              type="button"
              key={star}
              disabled={!interactive}
              onClick={() => interactive && setSelectedRating(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} text-lg leading-none`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                className={`w-5 h-5 transition-colors ${
                  filled ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
                }`}
              >
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
              </svg>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-200 mt-12" id="reviews-section">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`pb-4 font-black text-lg transition-all relative cursor-pointer ${
            activeTab === 'reviews' 
              ? 'text-emerald-700' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>دیدگاه و امتیاز خریداران</span>
          <span className="mr-2 text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {totalReviews}
          </span>
          {activeTab === 'reviews' && (
            <div className="absolute bottom-0 right-0 left-0 h-1 bg-emerald-600 rounded-t-full"></div>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('qa')}
          className={`pb-4 font-black text-lg transition-all relative cursor-pointer ${
            activeTab === 'qa' 
              ? 'text-purple-700' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>پرسش و پاسخ</span>
          <span className="mr-2 text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {questions.length}
          </span>
          {activeTab === 'qa' && (
            <div className="absolute bottom-0 right-0 left-0 h-1 bg-purple-600 rounded-t-full"></div>
          )}
        </button>
      </div>

      {/* TAB 1: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-10">
          {/* Summary / Rating Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 items-center">
            {/* Average Rating */}
            <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-l border-slate-200 pb-6 md:pb-0 md:pl-6 text-center">
              <div className="text-5xl font-black text-slate-900 mb-2">
                {avgRating > 0 ? avgRating.toLocaleString('fa-IR') : '۰'}
              </div>
              <div className="mb-2">{renderStars(Math.round(avgRating))}</div>
              <div className="text-xs text-slate-500 font-bold">
                بر اساس {totalReviews.toLocaleString('fa-IR')} نظر ثبت‌شده
              </div>
            </div>

            {/* Distribution Bars */}
            <div className="md:col-span-2 flex flex-col gap-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingDistribution[stars] || 0;
                const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <span className="w-12 text-slate-600 font-bold flex items-center gap-1">
                      <span>{stars}</span>
                      <span className="text-amber-400">★</span>
                    </span>
                    <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <span className="w-10 text-slate-400 text-left font-bold">{percent}٪</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submission Form for Verified Buyers */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6">
            <h4 className="font-bold text-slate-800 text-base mb-2">ثبت دیدگاه و امتیاز</h4>
            
            {!session ? (
              <div className="text-sm text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
                <span>برای ثبت نظر و امتیاز لطفاً ابتدا وارد حساب کاربری خود شوید.</span>
                <a href="/login" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm transition-colors">
                  ورود به حساب
                </a>
              </div>
            ) : !hasPurchased ? (
              <div className="text-xs text-amber-800 bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 flex-shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <span>تنها کاربرانی که این اثر را خریداری کرده‌اند امکان ثبت نظر و امتیاز را دارند. شما می‌توانید سوالات خود را در بخش «پرسش و پاسخ» مطرح نمایید.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">امتیاز شما به این اثر:</span>
                  {renderStars(selectedRating, true)}
                </div>

                <div>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="کیفیت ساخت، بسته‌بندی، جزئیات اثر و تجربه خرید خود را برای دیگر خریداران بنویسید..."
                    className="w-full p-4 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm leading-relaxed"
                    required
                  />
                </div>

                {reviewMsg && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${reviewMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {reviewMsg.text}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {submittingReview ? 'در حال ثبت...' : 'ارسال دیدگاه'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="text-center py-8 text-slate-400 font-bold text-sm">در حال بارگذاری نظرات...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              هنوز نظری برای این اثر ثبت نشده است. اولین خریدار باشید که نظر خود را ثبت می‌کند!
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-slate-100 pb-6 last:border-0">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-sm">
                        {r.user.image ? (
                          <img src={r.user.image} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          r.user.name?.[0] || 'ک'
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{r.user.name || 'کاربر هنرهاب'}</span>
                          {r.isBuyer && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ خریدار تایید شده
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(r.createdAt).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>
                    <div>{renderStars(r.rating)}</div>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed pr-13">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUESTIONS & ANSWERS */}
      {activeTab === 'qa' && (
        <div className="space-y-8">
          {/* Ask Question Form */}
          <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-6">
            <h4 className="font-bold text-slate-800 text-base mb-2">پرسش درباره اثر</h4>
            <p className="text-xs text-slate-500 mb-4">
              درباره ابعاد، نحوه نگهداری، سفارشی‌سازی یا زمان ارسال از هنرمند سوال بپرسید:
            </p>

            {!session ? (
              <div className="text-sm text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
                <span>برای ثبت پرسش، لطفاً وارد حساب خود شوید.</span>
                <a href="/login" className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm transition-colors">
                  ورود به حساب
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <textarea
                  rows={3}
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="پرسش خود را با رعایت احترام مطرح فرمایید..."
                  className="w-full p-4 rounded-xl border border-slate-300 focus:border-purple-500 outline-none text-sm leading-relaxed"
                  required
                />

                {qaMsg && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${qaMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {qaMsg.text}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingQuestion}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {submittingQuestion ? 'در حال ارسال...' : 'ثبت پرسش'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Questions List */}
          {questionsLoading ? (
            <div className="text-center py-8 text-slate-400 font-bold text-sm">در حال بارگذاری پرسش‌ها...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              هنوز پرسشی برای این اثر مطرح نشده است. اولین سوال را شما بپرسید!
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q) => (
                <div key={q.id} className="border border-slate-200 rounded-2xl p-5 space-y-4">
                  {/* Question */}
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs flex-shrink-0">
                      ؟
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800 text-sm">{q.user.name || 'کاربر'}</span>
                        <span className="text-[11px] text-slate-400">{new Date(q.createdAt).toLocaleDateString('fa-IR')}</span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">{q.question}</p>
                    </div>
                  </div>

                  {/* Answer (if available) */}
                  {q.answer ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mr-7 flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-xs flex-shrink-0">
                        پ
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-emerald-800 text-xs">پاسخ هنرمند اثر / پشتیبانی</span>
                          {q.answeredAt && (
                            <span className="text-[10px] text-slate-400">{new Date(q.answeredAt).toLocaleDateString('fa-IR')}</span>
                          )}
                        </div>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">{q.answer}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mr-7 text-xs text-amber-600 italic">
                      در انتظار پاسخ هنرمند...
                    </div>
                  )}

                  {/* Inline Answer form for Artist/Admin */}
                  {isArtistOrAdmin && (
                    <div className="mr-7 pt-2 border-t border-slate-100">
                      {answeringQuestionId === q.id ? (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            placeholder="پاسخ خود را به عنوان صاحب اثر بنویسید..."
                            className="w-full p-3 rounded-xl border border-purple-200 focus:border-purple-500 outline-none text-xs"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => { setAnsweringQuestionId(null); setAnswerText(''); }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100"
                            >
                              انصراف
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAnswerQuestion(q.id)}
                              disabled={submittingAnswer}
                              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              {submittingAnswer ? 'در حال ثبت...' : 'ثبت پاسخ'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setAnsweringQuestionId(q.id); setAnswerText(q.answer || ''); }}
                          className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                          <span>{q.answer ? 'ویرایش پاسخ هنرمند' : 'پاسخ به این پرسش'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
