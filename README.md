# Zikirlerim

Mobile-first, çevrimdışı çalışabilen kişisel ibadet ve okuma takip PWA’sı.

## Geliştirme

Node.js 22.13 veya üzeri gerekir.

```bash
npm install
npm run dev
```

Doğrulama için:

```bash
npm run lint
npm run typecheck
npm test
```

## Mimari

- `app/core`: Modül kayıtları, alan tipleri ve saf yardımcılar
- `app/data`: IndexedDB bağlantısı ve repository’ler
- `app/hooks`: Tekrar kullanılabilir etkileşim ve veri akışları
- `app/components`: Bölümlerden bağımsız arayüz parçaları
- `app/features`: Virdlerim, Beğenilenler, Keşfet, kitap ve yedekleme özellikleri
- `app/styles`: Sorumluluklarına göre ayrılmış global stil katmanları

Kullanıcı kütüphanesi cihazdaki IndexedDB’de tutulur. Hesap ve bulut eşitleme henüz bulunmaz.
Uygulama `/virdlerim` adresinde açılır; eski `/` bağlantıları buraya yönlenir. Eski tür rotaları ve depoları mevcut kayıtlarla uyumluluk için korunur.

### Koleksiyon modeli

Virdlerim ve Beğenilenler aynı kaydın bağımsız üyelikleridir; kalp ve `+` kayıt kopyalamaz.
Tür ve vakit seçimleri etiketlerdir. Yeni kayıtlar ortak kayıt oluşturma akışından geçer.
Eski dua/ezber/şiir/zikir depoları bir uyumluluk katmanında okunur; kimlikler ve geçmiş korunur.
Kitap kayıtları kendi alan modelini ve eski depo kimliğini korur; ortak koleksiyonlarda kitap kartı olarak gösterilir. Eski kitap oluşturma/düzenleme adresleri aynı akışı kullanır.

- `core/collections.ts`: kimlik, üyelik ve sıralama kuralları.
- `data/collection-repository.ts`: oluşturma, alan güncelleme, üyelik ve atomik sıralama.
- `components/RecordLibraryProvider.tsx`: bütün ekranların paylaştığı kayıt ve günlük tamamlanma state’i.
- `hooks/useRecordLibrary.ts`: tek yükleme ve seri yazma yaşam döngüsü; başarılı kalıcı yazıdan sonra state güncelleme.
- `hooks/useCompletionState.ts`: ortak günlük tamamlama, hata geri alma ve yerel gün değişimi.
- `features/collections/CollectionScreen.tsx`: iki koleksiyonun ortak ekranı.
- `components/RecordFilters.tsx`: ekranlar arası ortak çoklu filtreler.
- `core/record-filters.ts`: saf filtre ve çoklu seçim kuralları; filtre bileşeni hook tipine bağımlı değildir.
- `components/Dialog.tsx` ve `hooks/useDialogFocus.ts`: bütün editör/onay/hızlı ekleme pencerelerinde native dialog, odak, Escape ve animasyonlu kapanma.
- `core/module-registry.ts`: görünen bölümler ve eski depoların tek kayıt kaynağı.

IndexedDB v9 yükseltmesi mevcut kayıtları silmeden kitap dosyası, okuyucu durumu ve son kitap depolarını ekler. Önceki sürümlerdeki yıkıcı temizlik kaldırılmıştır.
Yedek dışa aktarımı bütün eski depoları ve tamamlanmaları içerir; içe aktarma/bulut eşitleme yoktur.

### Etkileşim ve hareket

`hooks/useSectionPager.ts` registry'deki ana ekranların native scroll-snap, URL ve aktif yükseklik davranışını yönetir. Ziyaret edilen ekranlar state'ini korur; komşu ekranlar kaydırma için hazır tutulur. Font önizlemeleri ayarlar aktif olduğunda yüklenir.

`styles/motion.css` ortak süre/easing token'larını, keyframe'leri ve hareket azaltma tercihini içerir. Yeni açılır alanlar `Accordion`, pencereler `Dialog` üzerinden ilerler. Yerleşim stilleri ilgili stil dosyasında kalır.

`core/devotional-draft.ts`, `useEditorForm` ve `useCreateRecord` hızlı/detaylı kayıt varsayılanlarını ve gönderim akışını paylaşır. `usePreferences` ayar okuma/yazma ve doğrulamasını, `data/arabic-font-loader.ts` font yüklemesini yönetir.

Dosya/fonksiyon envanteri, kararlar ve önce/sonra ölçümleri [mimari inceleme](docs/architecture-audit.md) belgesindedir.

### Kontroller

`npm run test:unit`, bellekte IndexedDB ile migration, üyelik bağımsızlığı, atomik geri alma,
çakışan kimlikler ve sıralama senaryolarını sınar. Kullanıcının tarayıcı verisini değiştirmez.
`npm test` TypeScript kontrolü, tüm birim test dosyaları, üretim build'i, sunucu çıktısı, eski rotalar ve mimari sınır kontrollerini çalıştırır.
Gerçek iOS PWA, çevrimdışı rota geçişleri ve dokunarak sıralama ayrıca cihazda kontrol edilmelidir.

### Kitap okuma

`+` → Kitap ekle ile PDF/EPUB seçilir. Kitaplar Beğenilenler ve Virdlerim'de ortak üyelik/sıralama altyapısını kullanır. Alt bardaki Kitap düğmesi yalnız son açılan kitabı okumak içindir; kitap seçimi kartın Oku / Devam et düğmesinden yapılır.

- PDF.js görünür PDF sayfasını ve metin katmanını işler; EPUB.js EPUB'u sandbox iframe içinde açar. Motorlar yalnız okuyucu açılınca yüklenir.
- `features/reader`: kalıcı okuyucu kabuğu, biçim adaptörleri ve seri kayıt hook'u. Son okuyucu kapanınca kaldırılmaz; kitap değişince kaynakları bırakılır.
- `data/reader-repository.ts`: kitap + Blob için atomik kayıt, dosyadan ayrı konum/not/tercihler. Dosya değişince yalnız o kitabın eski konumu/notları sıfırlanır; açık eski okuyucunun geç gelen yazısı yeni dosyayı etkileyemez.
- Okuyucu arayüzünde uygulamanın ortak alt menüsü sürekli görünür; ayrı okuyucu araç çubuğu yoktur. Yatay kaydırma PDF ve EPUB sayfaları arasında ilerler.
- PDF konumu sayfa ve düzeltilmiş dikey oranla, EPUB konumu CFI adresiyle saklanır. Önceki vurgu/not verileri korunur ancak sade okuyucuda gösterilmez veya düzenlenmez.
- `pdf-assets.ts` PDF worker, font, CMap ve WASM dosyalarını aynı origin üzerinden sunar ve üretim çıktısına ekler. İlk PDF açılışında destek kaynakları service worker'a önbellek için bildirilir.
- EPUB betikleri ve dış kaynakları kapalıdır. EPUB.js'in eski XML bağımlılığı güvenlik düzeltmeleri için `@xmldom/xmldom` 0.9.12 ile override edilir; sürüm değiştirirken okuyucu regresyonları kontrol edilmelidir.

Yedek çıktısı kitap bilgisi, ilerleme, tercihler ve notları içerir; PDF/EPUB Blob'larını içermez. Kitap dosyası kartından ayrıca indirilebilir. Dönüştürme, serbest çizim ve notları kaynak dosyaya işleyerek dışa aktarma bu sürümde yoktur.
