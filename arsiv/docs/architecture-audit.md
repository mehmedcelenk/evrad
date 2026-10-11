# Mimari inceleme — 24–25 Eylül 2026

## Sözleşme ve başlangıç

Üst dizindeki AGENTS.md okundu; ayrıca .agents.md bulunmadı. Katmanlar, 300 satır sınırı, veri koruma ve Türkçe metin kuralları bu iş için yeterli; kalıcı kurallara yeni tekrar eklenmedi. Başlangıçta dört dosyada kullanıcı değişikliği vardı; rozet yerleşimi ve parmak takibi/yükseklik davranışı korundu.

Başlangıç: 135 TS/TSX/CSS dosyası, 7439 satır; 300 satırı aşan dosya yok. Typecheck: create sekme tipi, QuickAdd içindeki eksik expandedArabicSize (iki kullanım) ve eksik DevotionalItem importu olmak üzere dört hata.

## Uzun dosya ve fonksiyon envanteri

180 satır üzerindeki dosyalar aşağıda. Katalog ve çeviri verileri sırf uzun diye parçalanmayacak.

| Dosya | Satır | Fonksiyonlar / sorumluluk |
|---|---:|---|
| `app/components/MainSectionsView.tsx` | 279 | MainSectionsView, getSectionIndex, updateVisualEffects, syncViewportHeight, resetViewportHeight, scrollToSection, setPosition, handleScroll, onResize, onPopState, handleReturnFromCreate, handleOpenDetailed |
| `app/styles/tracker.css` | 265 | Stil / sabit veri |
| `app/features/settings/ArabicFontSettings.tsx` | 246 | ArabicFontSettings, handleToggleHaptic, FontOptionRow |
| `app/AppShell.tsx` | 229 | AppShell, showToast, setShowDiacritics, setShowTranslations, setHapticEnabled, setDayResetTime, setFontSizeScale, setLineHeight |
| `app/components/TrackerPrimitives.tsx` | 229 | TrackableCardShell, CollapsedCardSummary, MiniTags, TargetBadge, triggerHaptic, CompletionLight, handleToggle, AddToLibraryButton, LikeButton, SortHandle, ExpandableCardContent, DetailBlock |
| `app/components/QuickAddModal.tsx` | 228 | QuickAddModal, QuickAddModalContent, handleKeyDown, handleQuickSave, handleInputKeyDown |
| `app/core/i18n.ts` | 228 | t |
| `app/styles/settings.css` | 219 | Stil / sabit veri |
| `app/hooks/useArabicFont.ts` | 217 | isFontAvailable, loadGoogleFont, applyArabicFontToDocument, applyStoredArabicFont, useArabicFont, onStorage, selectFont, useArabicFontPreviews |
| `app/hooks/useLongPressSort.ts` | 209 | useLongPressSort, finish, pointerDown, moveOverTarget, autoScroll, suppressClick, keyDown |
| `app/styles/context-chips.css` | 198 | Stil / sabit veri |
| `app/styles/quick-add.css` | 195 | Stil / sabit veri |
| `app/styles/base.css` | 188 | Stil / sabit veri |

## Başlangıç bulguları ve uygulanan plan

1. **Sekmeler:** MainSectionsView render, scroll, URL, yükseklik, RAF ve editör kapanışını birlikte yönetiyor. syncViewportHeight → activeSection bağı başlangıç konumunu yeniden uyguluyor. CSS timeline ve JS aynı efekti sürüyor; gecikmeli işler tam temizlenmiyor. Registry kaynaklı tek pager hook, tek efekt sürücüsü ve iptal edilebilir yaşam döngüsü kurulacak. Kullanılmayan legacy swipe yolu kaldırılacak.
2. **Paylaşılan veri:** İki koleksiyon ve keşif ayrı useRecordLibrary örnekleri, iki ayrı tamamlanma state'i açıyor. Hızlı ekleme repository'ye doğrudan yazıp bunları güncellemiyor. AppShell altında tek kayıt ve tek tamamlanma sağlayıcısı; oluşturma, patch, üyelik ve sıralama eylemleri birleştirilecek. IndexedDB şeması ve kayıt kimlikleri değişmeyecek.
3. **Ekleme/form:** QuickAdd, RecordCreate ve DevotionalEditor aynı başlangıç nesnesini farklı varsayılanlarla kuruyor. Saf draft dönüşümü ve tek kayıt oluşturma eylemi kullanılacak; çift gönderim engeli, hata ve kapatma yaşam döngüsü ortaklaştırılacak.
4. **Overlay:** QuickAdd, editör ve onay pencereleri farklı focus/escape/body-lock kodlarına sahip. Transform uygulanmış sekme içindeki fixed editör de yanlış kapsayıcıya bağlanabilir. Tarayıcının üst katmanında çalışan native `<dialog>` tabanlı ortak bileşen; odak yönetimi, Escape ve animasyon tamamlanınca kapanma kullanılacak.
5. **Ayarlar:** AppShell altı tercihi tekrarlı okuyup yazıyor; tipografi CSS etkisi iki kez var. Tercih doğrulama/depolama hook'a ayrılacak; slider/switch satırları ortaklaşacak. Haptic UI bileşeninden bağımsız tek yardımcıya taşınacak.
6. **Hareket:** Süre/easing değerleri on stil dosyasına dağılmış. Merkezi motion token'ları, ortak accordion ve overlay giriş/çıkışı; native scroll-snap ve hafif parmak takibi. prefers-reduced-motion hem JS hem CSS'te uygulanacak. Sürekli will-change ve tüm sayfaya ağır blur azaltılacak.
7. **Yük:** Görülmeyen ağır ekranları gereksiz yere başlatma; komşu sekmeleri kaydırma için hazır tut, ziyaret edilen ekran state'ini koru.
8. **Temizlik/doğrulama:** Kullanılmayan API ve selector'ları kanıtlayarak kaldır; katman sınırları, lint/typecheck, veri/yerel tarih regresyonları, build/render ve mobil tarayıcı etkileşimlerini doğrula. Gerçek iOS/120Hz ölçümü yapılmadan başarı iddiası yazma.

## Sonuç

Sekiz plan maddesi uygulandı. Ölçüm `app/` altındaki TS/TSX/CSS kaynaklarının sondaki boşlukları çıkarılmış satır sayısıdır; karşılaştırma Git HEAD ile değil, kullanıcının mevcut değişikliklerini içeren başlangıç çalışma ağacıyladır.

| Ölçüm | Başlangıç | Sonuç |
|---|---:|---:|
| Toplam kaynak satırı | 7439 | 6537 |
| Kaynak boyutu (bayt) | 277602 | 262525 |
| Kaynak dosyası | 135 | 151 |
| En uzun dosya | 279 | 229 |
| MainSectionsView | 279 | 45 |
| AppShell | 229 | 75 |
| QuickAddModal | 228 | 66 |
| ArabicFontSettings | 246 | 140 |
| useArabicFont | 217 | 101 |

Net **902 satır (%12,1)** kaldırıldı. Sorumluluk ayrımı nedeniyle dosya sayısı arttı; toplam kod azaldı. En uzun dosya `tracker.css` (229); en uzun hook `useLongPressSort` (210). Çeviri/katalog verileri ve kitapların farklı alan modeli korundu. Yeni bağımlılık eklenmedi.

### Ortak sorumlulukların adresleri

- `RecordLibraryProvider`: ekranların tek kayıt ve tek günlük tamamlanma kaynağı. `useRecordLibrary` yazıları sıraya alır, kalıcı işlemden sonra paylaşır; `useCompletionState` başarısız iyimser işlemi geri alır. Koleksiyon ve keşif artık ayrı kütüphane kopyaları tutmaz.
- `core/devotional-draft.ts`, `useCreateRecord`, `useEditorForm`, `useAsyncAction`, `FormActions`: hızlı/detaylı oluşturma, düzenleme, doğrulama, çift gönderim engeli ve kayıt sonrası kapanma.
- `Dialog`, `ActionDialog`, `useDialogFocus`: native üst katman, arka planın etkileşime kapanması, Escape, bekleyen işlemin korunması ve ortak giriş/çıkış. Hatalar açık pencerenin içinde de görünür; modal arkasındaki toast'a bağımlı değildir.
- `useSectionPager`: native scroll-snap, URL, kesilebilir gezinme, tek RAF efekt sürücüsü, ResizeObserver ile aktif sayfa yüksekliği. Kapanan ekranda timer/listener temizlenir. Eski `useSwipeNavigation` kaldırıldı.
- `styles/motion.css`, `Accordion`: süre/easing token'ları, keyframe'ler, ortak açılma/kapanma ve reduced-motion davranışı. Sayfa efekti opacity/scale ile sınırlı; sürekli tam sayfa blur ve iki ayrı efekt sürücüsü kaldırıldı.
- `usePreferences`, `core/preferences.ts`, `SettingsControls`, `core/haptics.ts`: doğrulanan tercihler, tek tipografi etkisi, ortak slider/switch ve haptic tercihini gözeten tek çağrı yolu.
- `data/arabic-font-loader.ts`: React'ten bağımsız yükleme ve aynı font için ortak istek. Var olmayan fontlarda da true dönebilen `FontFaceSet.check()` tek başına kullanılmaz; gerçek font yüzü ve Arapça örnek kontrol edilir. Yükleme hatası/zaman aşımı yeniden denenebilir. [API davranışı](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/check).
- `CollectionScreen` / `DiscoveryScreen`: kullanılmayan AppShell sarmalayıcıları kaldırıldı. `RecordCreateScreen` ayrımı QuickAdd → RecordCreateApp → AppShell döngüsünü önler.

### Doğrulama ve sınırlar

- `npm run lint` ve `npm test` başarılı. `npm test`: TypeScript, **30 birim testi**, üretim build'i ve **6 sunucu/mimari testi**.
- Eski `test:unit` komutu yalnız ilk dosyayı çalıştırıyordu. Node test runner bütün `tests/*.test.ts` dosyalarını çalıştıracak şekilde düzeltildi. Testler bellek içi IndexedDB kullanır; kullanıcı verisi sıfırlanmadı.
- Yeni regresyonlar: draft varsayılanları, kimlik/üyelik/sıralama korunması, tercih doğrulama ve depolama hatası, haptic tercihi, ortak font isteği, eksik font yüzü, zaman aşımı ve yeniden deneme.
- 320/375 px tarayıcı kontrolleri: hızlı kayıt, detaylandırırken metnin taşınması, düzenlemenin diğer koleksiyona yansıması, bağımsız üyelik, tamamlanma geçmişi, klavyeyle sıralama, Escape/kapatma, yatay kaydırma, hızlı ardışık navigasyon ve doğrudan oluşturma bağlantısı.
- Tercih/font seçimi ve kayıt/sıra/tamamlanma yeniden yüklemede korundu. 320 px'teki yatay taşma giderildi. Font önizlemesindeki hydration farkı giderildikten sonraki tarayıcı oturumunda hata kaydı yoktu.
- Tarayıcı yazma testleri ayrı `127.0.0.1` origin'inde yapıldı; mevcut localhost kayıtlarına dokunulmadı. IndexedDB v8, kimlikler ve kalıcı veri modeli değişmedi.
- Veri yükleme tekrarları, gereksiz efekt işi ve erken font önizleme yükü azaltıldı. FPS, LCP veya gerçek iOS cihaz performansı ölçülmedi; yüzde hızlanma/120Hz ve kusursuzluk iddiası yok. Gerçek iOS kurulu PWA, çevrimdışı geçiş ve fiziksel dokunmayla sıralama cihaz doğrulaması gerektirir.
