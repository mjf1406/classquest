import { sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { VERCEL_REGIONS } from '~/lib/constants';
import { db } from '~/server/db'; // Assuming you have a db instance exported from your server/db file
import { beta_signups } from '~/server/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export type TotalSignups = {
    totalSignups: number,
}

export async function GET(req: NextRequest) {
  try {
    // Get the total number of rows in the beta_signups table
    const totalSignups = await db.select({ count: sql<number>`count(*)` }).from(beta_signups);

    const region = process.env.VERCEL_REGION as keyof typeof VERCEL_REGIONS;
    if (region && VERCEL_REGIONS[region]) {
      console.log(`Hello from ${VERCEL_REGIONS[region]}`);
    } else {
      console.log('Hello from an unknown region');
    }

    // Return the total number of signups as a JSON response
    return new NextResponse(JSON.stringify({ totalSignups: totalSignups[0]?.count ?? 0 }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching beta signups:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Unable to fetch beta signups due to an internal error.' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}