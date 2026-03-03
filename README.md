# OsonTestOl Frontend

React + Vite asosidagi online test platforma frontend qismi.

## Asosiy imkoniyatlar
- 3 rol: `admin`, `teacher`, `student`
- Test yaratish va boshqarish
- Guruh va o'quvchi boshqaruvi
- Natijalar va tahlil
- Obuna/to'lov oqimi (lokal billing store)
- Real-time chat va test start/stop (Socket.IO)

## Talablar
- Node.js `18+`
- npm `9+`

## Ishga tushirish
1. Paketlarni o'rnatish:
```bash
npm install
```

2. `.env` yaratish:
```bash
cp .env.example .env
```

3. Kerak bo'lsa `VITE_API_BASE_URL` ni backend manziliga almashtiring.

4. Development:
```bash
npm run dev
```

5. Production build:
```bash
npm run build
```

6. Lint:
```bash
npm run lint
```

## Muhim eslatma
- Sessiya tozalash (`logout`) endi billing/subscription/catalog kabi tizim uchun kerakli lokal kalitlarni saqlab qoladi.
- Router role-based himoyaga ega: foydalanuvchi roliga mos bo'lmagan sahifa ochilmaydi.
