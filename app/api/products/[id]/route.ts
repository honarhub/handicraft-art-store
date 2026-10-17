import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        artist: { include: { user: true } },
        specialties: true,
        pricingTiers: true,
        reviews: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: 'desc' }
        },
        questions: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, status, adminFeedback, title, description, stockQuantity, isUnique, shippingMode, isPreOrderEnabled, preOrderTiers } = body;

    const currentProduct = await prisma.product.findUnique({
      where: { id },
      include: { specialties: true, pricingTiers: true }
    });

    if (!currentProduct) {
      return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
    }

    if (action === 'updateStatus') {
      const updateData: any = { status };
      if (adminFeedback !== undefined) {
        updateData.adminFeedback = adminFeedback;
      }
      const updated = await prisma.product.update({
        where: { id },
        data: updateData
      });
      return NextResponse.json(updated);
    }

    if (action === 'approvePendingEdits') {
      if (!currentProduct.pendingEdits) {
        return NextResponse.json({ error: 'هیچ ویرایش در انتظار تاییدی وجود ندارد' }, { status: 400 });
      }

      const edits = typeof currentProduct.pendingEdits === 'string' 
        ? JSON.parse(currentProduct.pendingEdits) 
        : (currentProduct.pendingEdits as any);

      const updateData: any = {
        title: edits.title || currentProduct.title,
        description: edits.description || currentProduct.description,
        imageUrl: edits.imageUrl || currentProduct.imageUrl,
        mediaUrls: edits.mediaUrls || currentProduct.mediaUrls,
        shippingMode: edits.shippingMode || currentProduct.shippingMode,
        isPreOrderEnabled: edits.isPreOrderEnabled !== undefined ? edits.isPreOrderEnabled : currentProduct.isPreOrderEnabled,
        preOrderTiers: edits.preOrderTiers !== undefined ? edits.preOrderTiers : currentProduct.preOrderTiers,
        seoMetaTitle: edits.seoMetaTitle !== undefined ? edits.seoMetaTitle : currentProduct.seoMetaTitle,
        seoMetaDesc: edits.seoMetaDesc !== undefined ? edits.seoMetaDesc : currentProduct.seoMetaDesc,
        seoKeywords: edits.seoKeywords !== undefined ? edits.seoKeywords : currentProduct.seoKeywords,
        status: 'APPROVED',
        pendingEdits: null,
        adminFeedback: null
      };

      if (edits.specialties && Array.isArray(edits.specialties)) {
        updateData.specialties = {
          set: edits.specialties.map((sid: string) => ({ id: sid }))
        };
      }

      if (edits.price) {
        const existingTiers = await prisma.pricingTier.findMany({ where: { productId: id } });
        if (existingTiers.length > 0) {
          await prisma.pricingTier.update({
            where: { id: existingTiers[0].id },
            data: { price: parseFloat(edits.price) }
          });
        }
      }

      const updated = await prisma.product.update({
        where: { id },
        data: updateData
      });
      return NextResponse.json(updated);
    }

    if (action === 'rejectPendingEdits') {
      const updated = await prisma.product.update({
        where: { id },
        data: {
          pendingEdits: null,
          adminFeedback: body.adminFeedback || 'تغییرات پیشنهادی شما تایید نشد.'
        }
      });
      return NextResponse.json(updated);
    }

    if (action === 'updateDetails') {
      const updateData: any = {
        title,
        description,
        stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity) : currentProduct.stockQuantity,
        isUnique: isUnique !== undefined ? isUnique : currentProduct.isUnique,
        shippingMode: shippingMode || currentProduct.shippingMode,
        isPreOrderEnabled: isPreOrderEnabled !== undefined ? Boolean(isPreOrderEnabled) : currentProduct.isPreOrderEnabled,
        preOrderTiers: preOrderTiers !== undefined ? preOrderTiers : currentProduct.preOrderTiers
      };

      if (body.price) {
        const existingTiers = await prisma.pricingTier.findMany({ where: { productId: id } });
        if (existingTiers.length > 0) {
          await prisma.pricingTier.update({
            where: { id: existingTiers[0].id },
            data: { price: parseFloat(body.price) }
          });
        }
      }

      const updated = await prisma.product.update({
        where: { id },
        data: updateData
      });
      return NextResponse.json(updated);
    }

    if (action === 'artistEdit') {
      const { specialties, seoMetaTitle, seoMetaDesc, seoKeywords, image, images } = body;

      // Handle media files properly: preserve existing URLs, save new base64 ones
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const incomingImages: string[] = images && images.length > 0 ? images : (image ? [image] : []);
      const finalMediaUrls: string[] = [];

      for (let i = 0; i < incomingImages.length; i++) {
        const item = incomingImages[i];
        if (item.startsWith('data:')) {
          const commaIndex = item.indexOf(',');
          const header = commaIndex !== -1 ? item.substring(0, commaIndex) : '';
          let ext = 'png';
          if (header.includes('video/')) ext = 'mp4';
          else if (header.includes('image/jpeg')) ext = 'jpg';
          else if (header.includes('image/webp')) ext = 'webp';

          const base64Data = commaIndex !== -1 ? item.substring(commaIndex + 1) : item;
          const fileName = `product_${Date.now()}_${i}.${ext}`;
          const filePath = path.join(uploadDir, fileName);
          await fsPromises.writeFile(filePath, Buffer.from(base64Data, 'base64'));
          finalMediaUrls.push(`/uploads/products/${fileName}`);
        } else if (item.startsWith('/uploads/') || item.startsWith('http')) {
          finalMediaUrls.push(item);
        }
      }

      const finalImageUrl = finalMediaUrls[0] || currentProduct.imageUrl;

      // If product was already APPROVED, store proposed edits in pendingEdits
      // This protects the live product from displaying unapproved changes or buggy single images!
      if (currentProduct.status === 'APPROVED') {
        const proposedEdits = {
          title: title || currentProduct.title,
          description: description || currentProduct.description,
          price: body.price ? parseFloat(body.price) : undefined,
          imageUrl: finalImageUrl,
          mediaUrls: finalMediaUrls.length > 0 ? finalMediaUrls : currentProduct.mediaUrls,
          specialties: specialties && Array.isArray(specialties) ? specialties : currentProduct.specialties.map(s => s.id),
          shippingMode: shippingMode || currentProduct.shippingMode,
          isPreOrderEnabled: isPreOrderEnabled !== undefined ? Boolean(isPreOrderEnabled) : currentProduct.isPreOrderEnabled,
          preOrderTiers: preOrderTiers !== undefined ? preOrderTiers : currentProduct.preOrderTiers,
          seoMetaTitle: seoMetaTitle || currentProduct.seoMetaTitle,
          seoMetaDesc: seoMetaDesc || currentProduct.seoMetaDesc,
          seoKeywords: seoKeywords || currentProduct.seoKeywords,
          submittedAt: new Date().toISOString()
        };

        const updated = await prisma.product.update({
          where: { id },
          data: {
            pendingEdits: proposedEdits,
            adminFeedback: null
          }
        });

        return NextResponse.json({
          ...updated,
          message: 'تغییرات شما برای بررسی ادمین ارسال شد و پس از تایید اعمال می‌گردد.'
        });
      } else {
        // Product is PENDING or REJECTED: update directly
        const updateData: any = {
          title,
          description,
          seoMetaTitle,
          seoMetaDesc,
          seoKeywords,
          status: 'PENDING',
          adminFeedback: null,
          imageUrl: finalImageUrl,
          mediaUrls: finalMediaUrls.length > 0 ? finalMediaUrls : currentProduct.mediaUrls,
          shippingMode: shippingMode || currentProduct.shippingMode,
          isPreOrderEnabled: isPreOrderEnabled !== undefined ? Boolean(isPreOrderEnabled) : currentProduct.isPreOrderEnabled,
          preOrderTiers: preOrderTiers !== undefined ? preOrderTiers : currentProduct.preOrderTiers
        };

        if (specialties && Array.isArray(specialties)) {
          updateData.specialties = {
            set: specialties.map((sid: string) => ({ id: sid }))
          };
        }

        if (body.price) {
          const existingTiers = await prisma.pricingTier.findMany({ where: { productId: id } });
          if (existingTiers.length > 0) {
            await prisma.pricingTier.update({
              where: { id: existingTiers[0].id },
              data: { price: parseFloat(body.price) }
            });
          } else {
            await prisma.pricingTier.create({
              data: {
                productId: id,
                tierType: 'STANDARD',
                title: 'خرید عادی',
                description: 'ارسال معمولی',
                price: parseFloat(body.price),
                deliveryTime: '7 روز کاری'
              }
            });
          }
        }

        const updated = await prisma.product.update({
          where: { id },
          data: updateData
        });

        return NextResponse.json(updated);
      }
    }

    return NextResponse.json({ error: 'عملیات نامعتبر است' }, { status: 400 });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'خطا در آپدیت محصول' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در حذف محصول' }, { status: 500 });
  }
}
