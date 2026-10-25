'use client';

import React from 'react';
import BlogEditPage from '../[id]/edit/page';

export default function NewBlogPage() {
  return <BlogEditPage params={Promise.resolve({ id: 'new' })} />;
}
