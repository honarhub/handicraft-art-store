import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { artist: true, specialties: true }
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
    const { action, status, adminFeedback, title, description, stockQuantity, isUnique } = body;

    let updateData: any = {};

    if (action === 'updateStatus') {
      updateData.status = status;
      if (adminFeedback !== undefined) {
        updateData.adminFeedback = adminFeedback;
      }
    } else if (action === 'updateDetails') {
      updateData.title = title;
      updateData.description = description;
      updateData.stockQuantity = stockQuantity;
      updateData.isUnique = isUnique;
      
      if (body.price) {
        const existingTiers = await prisma.pricingTier.findMany({ where: { productId: id } });
        if (existingTiers.length > 0) {
          await prisma.pricingTier.update({
            where: { id: existingTiers[0].id },
            data: { price: parseFloat(body.price) }
          });
        }
      }
    } else if (action === 'artistEdit') {
      const { specialties, seoMetaTitle, seoMetaDesc, seoKeywords, image, images } = body;
      
      updateData.title = title;
      updateData.description = description;
      updateData.seoMetaTitle = seoMetaTitle;
      updateData.seoMetaDesc = seoMetaDesc;
      updateData.seoKeywords = seoKeywords;
      updateData.status = 'PENDING'; // Reverts to pending when artist edits
      updateData.stockQuantity = 1; // Force 1

      const imagesToProcess = images && images.length > 0 ? images : (image ? [image] : []);
      if (imagesToProcess.length > 0) {
        const fs = require('fs');
        const fsPromises = require('fs').promises;
        const path = require('path');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        let mediaUrls: string[] = [];
        for (let i = 0; i < imagesToProcess.length; i++) {
          const img = imagesToProcess[i];
          const matches = img.match(/^data:(image|video)\/([a-zA-Z0-9]+);base64,(.+)$/);
          const ext = matches ? matches[2] : 'png';
          const base64Data = matches ? matches[3] : img.replace(/^data:image\/\w+;base64,/, "");
          
          const fileName = `product_${Date.now()}_${i}.${ext}`;
          const filePath = path.join(uploadDir, fileName);
          await fsPromises.writeFile(filePath, Buffer.from(base64Data, 'base64'));
          mediaUrls.push(`/uploads/products/${fileName}`);
        }
        updateData.imageUrl = mediaUrls[0];
        updateData.mediaUrls = mediaUrls;
      }

      if (specialties && Array.isArray(specialties)) {
        updateData.specialties = {
          set: specialties.map((sid: string) => ({ id: sid }))
        };
      }

      // We also need to update the base pricing tier
      if (body.price) {
        // Since Prisma requires multiple operations to update related fields inside an update,
        // it's easier to just do it separately if we don't know the tier ID, 
        // or we can use updateMany. Let's delete existing and create new, or update the first one.
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
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'خطا در آپدیت محصول' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در حذف محصول' }, { status: 500 });
  }
}
