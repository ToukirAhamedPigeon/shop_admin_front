'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';
export default function Logo({isTitle, className, titleClassName}: {isTitle: boolean, className?: string, titleClassName?: string}){
    return (
        <Link href="/" className={cn('flex items-center gap-3', className)}>
            <div className='bg-white/80 p-[2px] rounded-full'>
                <Image src="/logo.png" alt="Logo" width={32} height={32}  />
            </div>
            {isTitle && <span className={cn("text-lg font-semibold", titleClassName)}>Duty Hub</span>}
        </Link>
    );
};