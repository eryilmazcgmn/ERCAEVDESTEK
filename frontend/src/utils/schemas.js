import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2, 'Lütfen adınızı ve soyadınızı giriniz.').max(100, 'Ad soyad çok uzun.'),
  phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz (Örn: 0532 123 45 67)').max(20, 'Telefon numarası çok uzun.'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz (Örn: ahmet@gmail.com)').optional().or(z.literal('')),
  address: z.string().min(3, 'Lütfen sokak, bina ve daire bilgilerinizi eksiksiz giriniz.').max(500, 'Adres çok uzun.'),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Kullanıcı adı giriniz.'),
  password: z.string().min(1, 'Şifre giriniz.'),
});

export const technicianSchema = z.object({
  name: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır.'),
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
});

export const assignWorkOrderSchema = z.object({
  technician_id: z.string().min(1, 'Lütfen bir teknisyen seçin.'),
  scheduled_at: z.string().optional(),
});
