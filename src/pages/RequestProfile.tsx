import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone, ArrowLeft, ArrowRight, User, Store, UtensilsCrossed,
  Check, Loader2, Upload, QrCode, ImagePlus, CreditCard, Package, 
  CheckCircle2, Clock, XCircle, Phone, Mail, MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createProfileRequest, fetchUserProfileRequests } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const PROFILE_TYPES = [
  { value: "personal", label: "Personal", icon: User, description: "For individuals — share your contact details, portfolio & social links.", color: "from-blue-500 to-indigo-600" },
  { value: "business", label: "Business", icon: Store, description: "For companies — showcase services, contact info & Google Reviews.", color: "from-emerald-500 to-teal-600" },
  { value: "restaurant", label: "Restaurant", icon: UtensilsCrossed, description: "For restaurants — digital menu, ordering system & reviews.", color: "from-orange-500 to-red-600" },
];

const PACKAGES = [
  { 
    id: "basic", 
    name: "Basic", 
    price: "Rs. 1,500", 
    priceNum: 1500,
    period: "/month",
    features: ["1 Digital Profile", "QR Code", "Basic Themes", "Contact Buttons", "50 Monthly Views"],
    color: "border-slate-200 bg-slate-50/50",
    badge: null,
  },
  { 
    id: "pro", 
    name: "Pro", 
    price: "Rs. 3,500", 
    priceNum: 3500,
    period: "/month",
    features: ["3 Digital Profiles", "QR + NFC Support", "Premium Themes", "Gallery & Social Links", "Unlimited Views", "Google Reviews"],
    color: "border-primary/30 bg-primary/5",
    badge: "Most Popular",
  },
  { 
    id: "premium", 
    name: "Premium", 
    price: "Rs. 7,500", 
    priceNum: 7500,
    period: "/month",
    features: ["Unlimited Profiles", "QR + NFC + Menu System", "All Themes + Custom Branding", "Ordering System", "Priority Support", "Analytics Dashboard"],
    color: "border-amber-300 bg-amber-50/50",
    badge: "Best Value",
  },
];

// Payment QR details (replace with your actual details)
const PAYMENT_QR = {
  bankName: "Bank of Ceylon",
  accountName: "CreativeX Technology",
  accountNumber: "12345678901234",
  branch: "Main Branch",
};

export default function RequestProfile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [profileType, setProfileType] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [selectedPackage, setSelectedPackage] = useState("");
  const [paymentSlip, setPaymentSlip] = useState<{ file: File | null; preview: string | null }>({ file: null, preview: null });

  // Fetch existing requests
  const { data: existingRequests = [] } = useQuery({
    queryKey: ["profile-requests", user?.id],
    queryFn: () => fetchUserProfileRequests(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user?.email) setForm(f => ({ ...f, email: user.email! }));
  }, [user?.email]);

  const pendingRequests = existingRequests.filter(r => r.status === "pending");

  const set = (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const canProceedStep2 = !!profileType;
  const canProceedStep3 = form.name.trim() && form.email.trim() && form.phone.trim();
  const canProceedStep4 = !!selectedPackage;

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      let slipUrl: string | null = null;

      // Upload payment slip if provided
      if (paymentSlip.file) {
        const ext = paymentSlip.file.name.split(".").pop();
        const path = `payment-slips/${user.id}/${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("profile-images")
          .upload(path, paymentSlip.file, { upsert: true });
        if (uploadErr) throw uploadErr;
        if (uploadData) {
          slipUrl = supabase.storage.from("profile-images").getPublicUrl(uploadData.path).data.publicUrl;
        }
      }

      await createProfileRequest({
        user_id: user.id,
        profile_type: profileType,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address || null,
        package: selectedPackage,
        payment_slip_url: slipUrl,
        status: "pending",
      });

      setSubmitted(true);
      toast({ title: "Request Submitted!", description: "Your profile request is being reviewed by our team." });
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Success State ──
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center py-12 px-6 border-none shadow-2xl">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Request Submitted!</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Your profile request has been submitted successfully. Our admin team will review it and get back to you shortly.
          </p>
          <div className="bg-muted/50 rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Type</span><span className="font-medium capitalize">{profileType}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Package</span><span className="font-medium capitalize">{selectedPackage}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1 px-1.5 py-0"><Clock className="h-3 w-3" /> Pending Review</Badge></div>
          </div>
          <Button asChild className="w-full h-11 rounded-xl font-bold">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <Smartphone className="h-6 w-6 text-primary" />
            SmartTap
          </Link>
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Request Profile
          </span>
        </div>
      </header>

      <main className="container max-w-2xl py-8">
        {/* Pending Requests Banner */}
        {pendingRequests.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">You have {pendingRequests.length} pending request(s)</p>
                  <p className="text-xs text-amber-600 mt-0.5">Please wait for your existing request(s) to be reviewed before submitting a new one.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step === s ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30" :
                step > s ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 4 && <div className={`w-8 sm:w-12 h-0.5 rounded transition-colors duration-300 ${step > s ? "bg-green-500" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card className="card-elevated border-none shadow-xl">
          {/* ── Step 1: Choose Profile Type ── */}
          {step === 1 && (
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-display text-2xl">Choose Profile Type</CardTitle>
                <CardDescription>Select the type of digital profile you need</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {PROFILE_TYPES.map((type) => {
                  const Icon = type.icon;
                  const selected = profileType === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setProfileType(type.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                        selected 
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]" 
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center shrink-0`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{type.label} Profile</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{type.description}</p>
                      </div>
                      {selected && (
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
                <div className="pt-4">
                  <Button onClick={() => setStep(2)} disabled={!canProceedStep2} className="w-full h-12 rounded-xl font-bold text-base">
                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* ── Step 2: Enter Details ── */}
          {step === 2 && (
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-display text-2xl">Your Details</CardTitle>
                <CardDescription>Tell us about you so we can set up your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="req-name" className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Full Name / Business Name *</Label>
                  <Input id="req-name" value={form.name} onChange={set("name")} placeholder="e.g. John's Kitchen" className="h-12 rounded-xl text-base" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="req-email" className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email *</Label>
                    <Input id="req-email" type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" className="h-12 rounded-xl text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req-phone" className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Contact Number *</Label>
                    <Input id="req-phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+94 7X XXX XXXX" className="h-12 rounded-xl text-base" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req-address" className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Address</Label>
                  <Input id="req-address" value={form.address} onChange={set("address")} placeholder="123 Main Street, Colombo" className="h-12 rounded-xl text-base" />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="h-12 rounded-xl font-bold flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!canProceedStep3} className="h-12 rounded-xl font-bold flex-[2]">
                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* ── Step 3: Choose Package ── */}
          {step === 3 && (
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-display text-2xl">Choose Your Package</CardTitle>
                <CardDescription>Select the plan that fits your needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {PACKAGES.map((pkg) => {
                  const selected = selectedPackage === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 text-left relative overflow-hidden ${
                        selected
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]"
                          : `${pkg.color} hover:border-primary/30`
                      }`}
                    >
                      {pkg.badge && (
                        <Badge className="absolute top-3 right-3 text-[10px] bg-primary text-white">{pkg.badge}</Badge>
                      )}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-primary" />
                            <p className="font-bold text-base">{pkg.name}</p>
                          </div>
                          <div className="flex items-baseline gap-1 mb-3">
                            <span className="text-2xl font-bold">{pkg.price}</span>
                            <span className="text-xs text-muted-foreground">{pkg.period}</span>
                          </div>
                          <div className="space-y-1.5">
                            {pkg.features.map((f, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Check className="h-3 w-3 text-green-500 shrink-0" />
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {selected && (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="h-12 rounded-xl font-bold flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                  <Button onClick={() => setStep(4)} disabled={!canProceedStep4} className="h-12 rounded-xl font-bold flex-[2]">
                    <CreditCard className="h-4 w-4 mr-2" /> Pay Now
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* ── Step 4: Payment ── */}
          {step === 4 && (
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-display text-2xl">Complete Payment</CardTitle>
                <CardDescription>Scan the QR code or upload your bank slip</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                {/* Order Summary */}
                <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order Summary</p>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Profile Type</span><span className="font-medium capitalize">{profileType}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Package</span><span className="font-medium capitalize">{selectedPackage}</span></div>
                  <div className="flex justify-between text-sm border-t pt-2 mt-2">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary">{PACKAGES.find(p => p.id === selectedPackage)?.price}</span>
                  </div>
                </div>

                {/* QR Payment */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                    <QrCode className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-primary">Scan to Pay</span>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-primary/20 inline-block mb-4">
                    <div className="h-48 w-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex flex-col items-center justify-center gap-2">
                      <QrCode className="h-16 w-16 text-primary/60" />
                      <p className="text-[10px] text-muted-foreground font-medium">Payment QR Code</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl p-3 text-left space-y-1 max-w-sm mx-auto">
                    <p className="text-xs font-bold text-blue-800">Bank Transfer Details</p>
                    <p className="text-[11px] text-blue-700"><strong>Bank:</strong> {PAYMENT_QR.bankName}</p>
                    <p className="text-[11px] text-blue-700"><strong>Account:</strong> {PAYMENT_QR.accountName}</p>
                    <p className="text-[11px] text-blue-700"><strong>Acc No:</strong> {PAYMENT_QR.accountNumber}</p>
                    <p className="text-[11px] text-blue-700"><strong>Branch:</strong> {PAYMENT_QR.branch}</p>
                  </div>
                </div>

                {/* Upload Bank Slip */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> Upload Payment Slip / Screenshot</Label>
                  <label className="flex flex-col items-center justify-center h-36 w-full rounded-2xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 hover:bg-primary/5 cursor-pointer overflow-hidden relative transition-all">
                    {paymentSlip.preview ? (
                      <>
                        <img src={paymentSlip.preview} alt="Payment Slip" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-xs text-white font-bold">Click to change</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground/60 gap-2">
                        <ImagePlus className="h-8 w-8" />
                        <span className="text-xs font-medium">Upload bank slip or screenshot</span>
                        <span className="text-[10px] text-muted-foreground/40">JPG, PNG or PDF</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPaymentSlip({ file, preview: URL.createObjectURL(file) });
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="h-12 rounded-xl font-bold flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="h-12 rounded-xl font-bold flex-[2] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Submit Request
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                  By submitting, you agree to our terms of service. Your request will be reviewed within 24 hours.
                </p>
              </CardContent>
            </>
          )}
        </Card>

        {/* Existing Requests */}
        {existingRequests.length > 0 && (
          <Card className="mt-8 card-elevated border-none">
            <CardHeader>
              <CardTitle className="text-base font-display">Your Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {existingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      req.profile_type === "personal" ? "bg-blue-100" : req.profile_type === "business" ? "bg-emerald-100" : "bg-orange-100"
                    }`}>
                      {req.profile_type === "personal" ? <User className="h-4 w-4 text-blue-600" /> :
                       req.profile_type === "business" ? <Store className="h-4 w-4 text-emerald-600" /> :
                       <UtensilsCrossed className="h-4 w-4 text-orange-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{req.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{req.profile_type} • {req.package} package</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`shrink-0 gap-1 px-1.5 py-0 text-[10px] ${
                    req.status === "approved" ? "text-green-600 border-green-200 bg-green-50" :
                    req.status === "rejected" ? "text-red-600 border-red-200 bg-red-50" :
                    "text-amber-600 border-amber-200 bg-amber-50"
                  }`}>
                    {req.status === "approved" ? <CheckCircle2 className="h-3 w-3" /> :
                     req.status === "rejected" ? <XCircle className="h-3 w-3" /> :
                     <Clock className="h-3 w-3" />}
                    {req.status === "approved" ? "Approved" : req.status === "rejected" ? "Rejected" : "Pending"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
