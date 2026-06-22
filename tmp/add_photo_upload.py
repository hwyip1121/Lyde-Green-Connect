import sys

path = "/Users/" + __import__('os').environ.get('USER', 'yip') + "/Downloads/lyde-green-connect/app/market/page.tsx"

with open(path, "r") as f:
    content = f.read()

# 1. Add ImageIcon to lucide imports
content = content.replace(
    'import { Plus, Package, X, Loader2, Flag } from "lucide-react";',
    'import { Plus, Package, X, Loader2, Flag, ImageIcon } from "lucide-react";'
)

# 2. Add imageFile + imagePreview state after the form state
content = content.replace(
    '  const [form, setForm] = useState({ title: "", description: "", price: "", isFreeSwap: false, isWanted: false });',
    '  const [form, setForm] = useState({ title: "", description: "", price: "", isFreeSwap: false, isWanted: false });\n  const [imageFile, setImageFile] = useState<File | null>(null);\n  const [imagePreview, setImagePreview] = useState<string | null>(null);'
)

# 3. Replace handleSubmit with image-aware version
old_submit = '''  const handleSubmit = async () => {
    const rl = checkRateLimit(user.id);
    if (!rl.allowed) { setError(`Please wait ${formatResetTime(rl.resetInMs)} before posting again.`); return; }
    const titleMod = moderateContent(form.title);
    if (!titleMod.safe) { setError("Your title contains content that isn't allowed."); return; }
    const descMod = moderateContent(form.description);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: profile } = await supabase.from("profiles").select("neighbourhood").eq("id", user.id).single();
      await supabase.from("market_listings").insert({
        user_id: user.id, title: titleMod.sanitised, description: descMod.sanitised,
        price_pence: form.isFreeSwap ? null : form.price ? Math.round(parseFloat(form.price) * 100) : 0,
        is_free_swap: form.isFreeSwap, is_wanted: form.isWanted, neighbourhood: profile?.neighbourhood || "Lyde Green",
      });
      onCreated();
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };'''

new_submit = '''  const handleSubmit = async () => {
    const rl = checkRateLimit(user.id);
    if (!rl.allowed) { setError(`Please wait ${formatResetTime(rl.resetInMs)} before posting again.`); return; }
    const titleMod = moderateContent(form.title);
    if (!titleMod.safe) { setError("Your title contains content that isn't allowed."); return; }
    const descMod = moderateContent(form.description);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: profile } = await supabase.from("profiles").select("neighbourhood").eq("id", user.id).single();
      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("market-images")
          .upload(path, imageFile, { upsert: false });
        if (uploadError) { setError("Image upload failed. Please try again."); setLoading(false); return; }
        const { data: urlData } = supabase.storage.from("market-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
      await supabase.from("market_listings").insert({
        user_id: user.id, title: titleMod.sanitised, description: descMod.sanitised,
        price_pence: form.isFreeSwap ? null : form.price ? Math.round(parseFloat(form.price) * 100) : 0,
        is_free_swap: form.isFreeSwap, is_wanted: form.isWanted, neighbourhood: profile?.neighbourhood || "Lyde Green",
        image_url: imageUrl,
      });
      onCreated();
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };'''

content = content.replace(old_submit, new_submit)

# 4. Insert photo upload UI just before the error block
old_error = '          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}'

new_photo_and_error = '''          {/* Photo upload */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Photo <span className="text-slate-400 font-normal">(optional)</span></label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 w-7 h-7 bg-slate-900/60 rounded-full flex items-center justify-center text-white hover:bg-slate-900/80">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 w-full h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors">
                <ImageIcon className="w-6 h-6 text-slate-400" />
                <span className="text-sm text-slate-500">Tap to add a photo</span>
                <span className="text-xs text-slate-400">JPG, PNG or WEBP · max 5MB</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}'''

content = content.replace(old_error, new_photo_and_error)

with open(path, "w") as f:
    f.write(content)

print("✅ Done — market/page.tsx updated successfully.")
