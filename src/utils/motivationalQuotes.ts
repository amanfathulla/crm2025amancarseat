const motivationalQuotes = [
  "Kejayaan bukan destinasi, ia adalah perjalanan yang penuh semangat! 🚀",
  "Setiap langkah kecil membawa kepada kejayaan besar! 💪",
  "Hari ini adalah peluang baru untuk berjaya! ⭐",
  "Usaha yang konsisten menghasilkan kejayaan luar biasa! 🔥",
  "Jangan pernah berhenti mengejar impian anda! 🎯",
  "Cabaran hari ini adalah kekuatan esok! 💎",
  "Setiap pelanggan baru adalah satu langkah ke arah kejayaan! 🤝",
  "Fokus, disiplin, dan semangat adalah kunci kejayaan! 🏆",
  "Berani bermimpi besar, berani bekerja keras! 🌟",
  "Kejayaan bermula dengan keberanian untuk memulakan! 🦅",
  "Konsistensi mengalahkan bakat tanpa usaha! 💪",
  "Masa depan milik mereka yang berani bertindak hari ini! 🎯",
  "Setiap hari adalah peluang untuk menjadi lebih baik! 🌅",
  "Kerja keras hari ini, nikmati hasilnya esok! 🏅",
  "Jangan tunggu peluang, cipta peluang! ⚡",
  "Berjaya bukan kebetulan, ia adalah pilihan! 💫",
  "Senyum, semangat, dan terus berjuang! 😊",
  "Setiap cabaran adalah pelajaran berharga! 📚",
  "Tekad yang kuat mampu menggerakkan gunung! 🏔️",
  "Jadilah versi terbaik diri anda hari ini! 🌈",
  "Kesabaran dan usaha tidak pernah sia-sia! 🌻",
  "Yakin pada diri sendiri, kejayaan pasti milik anda! 🎖️",
  "Langkah pertama selalu yang paling penting! 👣",
  "Bersyukur, berusaha, berjaya! 🙏",
  "Impian tanpa tindakan hanyalah angan-angan! 🚀",
  "Keberanian mengubah dunia! 🌍",
  "Anda lebih kuat daripada yang anda sangka! 💎",
  "Setiap detik adalah peluang untuk berubah! ⏰",
  "Jatuh itu biasa, bangkit itu luar biasa! 🦋",
  "Percaya proses, nikmati perjalanan! 🛤️",
  "Hari ini saya akan lebih baik dari semalam! 📈",
];

/**
 * Get the motivational quote for today based on the day of the year.
 * Changes daily.
 */
export function getDailyQuote(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return motivationalQuotes[dayOfYear % motivationalQuotes.length];
}
