1. Vercel-ə yüklə

Bu qovluğu GitHub-a push et (yeni repo yarat), sonra Vercel-də "New Project" ilə həmin repo-nu import et. Deploy avtomatik olacaq.

Alternativ: Vercel CLI ilə birbaşa bu qovluqdan:

npm i -g vercel
vercel
2. Environment Variables (Vercel > Project > Settings > Environment Variables)

Üç dəyişən əlavə et:

IG_ACCESS_TOKEN — Meta Developer Console-dan aldığın access token
VERIFY_TOKEN — özün uydur, istənilən mətn (məs: kafe2026salam) — bunu həm buraya, həm də Meta-nın Callback URL formasındakı "Verify token" sahəsinə eyni cür yaz
ANTHROPIC_API_KEY — console.anthropic.com-dan alınan API açarı

Dəyişdikdən sonra "Redeploy" et ki, yeni env variable-lar aktiv olsun.

3. Meta Developer Console-da webhook-u qur

"3. Configure webhooks" bölməsində:

Callback URL: https://SƏNIN-DOMAININ.vercel.app/api/webhook
Verify token: yuxarıda seçdiyin token (məs: kafe2026salam)
"Verify and save" bas

Əgər uğurlu olsa, yaşıl ✓ görəcəksən.

4. Mesaj icazələrini abunə et

Webhook düz işə düşdükdən sonra, "messages" event-inə subscribe olmaq lazımdır — bu adətən "Add subscriptions" və ya "messages" checkbox-u şəklində eyni səhifədə gəlir.

5. Token-in ömrü

Instagram-dan aldığın access token bir müddət sonra (adətən 60 gün) bitə bilər. Uzunmüddətli token almaq və avtomatik yeniləmək üçün ayrıca addım lazımdır — sayt işə düşəndən sonra bunu quraşdıraq.

Test

Kafenin Instagram hesabına başqa bir hesabdan DM yaz (məs: "salam, iş saatlarınız nədir?") — bot avtomatik cavab verməlidir.
