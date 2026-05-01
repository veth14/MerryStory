import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthGuardError } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);

    const db = await getMongoDb();
    const eventsCollection = db.collection("events");
    const inquiriesCollection = db.collection("inquiries");

    // Fetch all events and inquiries
    const events = await eventsCollection.find({}).toArray();
    const inquiries = await inquiriesCollection.find({}).toArray();

    // Helper function to get month from date
    const getMonth = (date: Date | string | undefined): number => {
      if (!date) return 0;
      const d = new Date(date);
      return d.getMonth();
    };

    // Group bookings (events) by month
    const bookingsByMonth: { [key: number]: number } = {};
    events.forEach(event => {
      const monthIndex = getMonth(event.date);
      bookingsByMonth[monthIndex] = (bookingsByMonth[monthIndex] || 0) + 1;
    });

    // Group inquiries by month
    const inquiriesByMonth: { [key: number]: number } = {};
    inquiries.forEach(inq => {
      const monthIndex = getMonth(inq.submitted);
      inquiriesByMonth[monthIndex] = (inquiriesByMonth[monthIndex] || 0) + 1;
    });

    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const shortMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Generate monthly frequency data (normalized to 0-100 scale)
    const monthlyValues = Array.from({ length: 12 }, (_, i) => ({
      bookings: bookingsByMonth[i] || 0,
      inquiries: inquiriesByMonth[i] || 0,
    }));

    // Find max value to normalize
    const maxValue = Math.max(...monthlyValues.map(m => Math.max(m.bookings, m.inquiries)), 1);
    const normalized = monthlyValues.map(m => ({
      bookings: Math.round((m.bookings / maxValue) * 100),
      inquiries: Math.round((m.inquiries / maxValue) * 100),
    }));

    // Generate quarterly data
    const quarterlyFrequency = [
      {
        label: 'Q1',
        bookings: normalized[0].bookings,
        inquiries: normalized[0].inquiries,
        actualBookings: monthlyValues[0].bookings + monthlyValues[1].bookings + monthlyValues[2].bookings,
        actualInquiries: monthlyValues[0].inquiries + monthlyValues[1].inquiries + monthlyValues[2].inquiries,
      },
      {
        label: 'Q2',
        bookings: normalized[3].bookings,
        inquiries: normalized[3].inquiries,
        actualBookings: monthlyValues[3].bookings + monthlyValues[4].bookings + monthlyValues[5].bookings,
        actualInquiries: monthlyValues[3].inquiries + monthlyValues[4].inquiries + monthlyValues[5].inquiries,
      },
      {
        label: 'Q3',
        bookings: normalized[6].bookings,
        inquiries: normalized[6].inquiries,
        actualBookings: monthlyValues[6].bookings + monthlyValues[7].bookings + monthlyValues[8].bookings,
        actualInquiries: monthlyValues[6].inquiries + monthlyValues[7].inquiries + monthlyValues[8].inquiries,
      },
      {
        label: 'Q4',
        bookings: normalized[9].bookings,
        inquiries: normalized[9].inquiries,
        actualBookings: monthlyValues[9].bookings + monthlyValues[10].bookings + monthlyValues[11].bookings,
        actualInquiries: monthlyValues[9].inquiries + monthlyValues[10].inquiries + monthlyValues[11].inquiries,
      },
    ];

    // Generate half-year data
    const halfYearFrequency = [
      {
        label: 'H1',
        bookings: Math.round((normalized[0].bookings + normalized[1].bookings + normalized[2].bookings + normalized[3].bookings + normalized[4].bookings + normalized[5].bookings) / 6),
        inquiries: Math.round((normalized[0].inquiries + normalized[1].inquiries + normalized[2].inquiries + normalized[3].inquiries + normalized[4].inquiries + normalized[5].inquiries) / 6),
        actualBookings: monthlyValues[0].bookings + monthlyValues[1].bookings + monthlyValues[2].bookings + monthlyValues[3].bookings + monthlyValues[4].bookings + monthlyValues[5].bookings,
        actualInquiries: monthlyValues[0].inquiries + monthlyValues[1].inquiries + monthlyValues[2].inquiries + monthlyValues[3].inquiries + monthlyValues[4].inquiries + monthlyValues[5].inquiries,
      },
      {
        label: 'H2',
        bookings: Math.round((normalized[6].bookings + normalized[7].bookings + normalized[8].bookings + normalized[9].bookings + normalized[10].bookings + normalized[11].bookings) / 6),
        inquiries: Math.round((normalized[6].inquiries + normalized[7].inquiries + normalized[8].inquiries + normalized[9].inquiries + normalized[10].inquiries + normalized[11].inquiries) / 6),
        actualBookings: monthlyValues[6].bookings + monthlyValues[7].bookings + monthlyValues[8].bookings + monthlyValues[9].bookings + monthlyValues[10].bookings + monthlyValues[11].bookings,
        actualInquiries: monthlyValues[6].inquiries + monthlyValues[7].inquiries + monthlyValues[8].inquiries + monthlyValues[9].inquiries + monthlyValues[10].inquiries + monthlyValues[11].inquiries,
      },
    ];

    // Find peak months for bookings and inquiries
    let peakBookingMonth = 0;
    let maxBookings = 0;
    let peakInquiryMonth = 0;
    let maxInquiries = 0;

    bookingsByMonth && Object.entries(bookingsByMonth).forEach(([monthStr, count]) => {
      if (count > maxBookings) {
        maxBookings = count;
        peakBookingMonth = parseInt(monthStr);
      }
    });

    inquiriesByMonth && Object.entries(inquiriesByMonth).forEach(([monthStr, count]) => {
      if (count > maxInquiries) {
        maxInquiries = count;
        peakInquiryMonth = parseInt(monthStr);
      }
    });

    // Count event types with bookings and inquiries
    const eventTypeData: { [key: string]: { bookings: number; inquiries: number } } = {};
    
    events.forEach(event => {
      const type = event.type || 'Other';
      if (!eventTypeData[type]) {
        eventTypeData[type] = { bookings: 0, inquiries: 0 };
      }
      eventTypeData[type].bookings += 1;
    });

    inquiries.forEach(inq => {
      const type = inq.eventType || 'Other';
      if (!eventTypeData[type]) {
        eventTypeData[type] = { bookings: 0, inquiries: 0 };
      }
      eventTypeData[type].inquiries += 1;
    });

    console.log('Event Type Data:', eventTypeData);
    console.log('Total Inquiries:', inquiries.length);
    console.log('Total Events:', events.length);

    // Map event types to standard names
    const typeMapping: { [key: string]: string } = {
      'wedding': 'Weddings',
      'weddings': 'Weddings',
      'elegant wedding': 'Weddings',
      'corporate': 'Corporate Galas',
      'corporate gala': 'Corporate Galas',
      'corporate galas': 'Corporate Galas',
      'party': 'Private Parties',
      'private party': 'Private Parties',
      'private parties': 'Private Parties',
      'birthday': 'Private Parties',
      'birthday celebration': 'Private Parties',
      'charity': 'Charity / Non-Profit',
      'non-profit': 'Charity / Non-Profit',
      'charity / non-profit': 'Charity / Non-Profit',
      'consultation': 'Consultations',
      'product launch': 'Product Launches',
    };

    const normalizedTypes: { [key: string]: { bookings: number; inquiries: number } } = {};
    Object.entries(eventTypeData).forEach(([type, counts]) => {
      const normalizedType = typeMapping[type.toLowerCase()] || type;
      if (!normalizedTypes[normalizedType]) {
        normalizedTypes[normalizedType] = { bookings: 0, inquiries: 0 };
      }
      normalizedTypes[normalizedType].bookings += counts.bookings;
      normalizedTypes[normalizedType].inquiries += counts.inquiries;
    });

    // Convert to array and sort by total count (bookings + inquiries)
    const eventTypeBreakdown = Object.entries(normalizedTypes)
      .map(([type, counts]) => ({
        type,
        bookings: counts.bookings,
        inquiries: counts.inquiries,
        count: counts.bookings + counts.inquiries,
        percentage: 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate percentages
    const totalEvents = eventTypeBreakdown.reduce((sum, e) => sum + e.count, 0);
    eventTypeBreakdown.forEach(e => {
      e.percentage = totalEvents > 0 ? Math.round((e.count / totalEvents) * 100) : 0;
    });

    console.log('Event Type Breakdown:', eventTypeBreakdown);

    return NextResponse.json(
      {
        monthlyFrequency: Array.from({ length: 12 }, (_, i) => ({
          label: shortMonths[i],
          bookings: normalized[i].bookings,
          inquiries: normalized[i].inquiries,
          actualBookings: monthlyValues[i].bookings,
          actualInquiries: monthlyValues[i].inquiries,
        })),
        quarterlyFrequency,
        halfYearFrequency,
        annualFrequency: {
          label: '2026',
          bookings: Math.round((normalized.reduce((sum, m) => sum + m.bookings, 0) / 12)),
          inquiries: Math.round((normalized.reduce((sum, m) => sum + m.inquiries, 0) / 12)),
          actualBookings: monthlyValues.reduce((sum, m) => sum + m.bookings, 0),
          actualInquiries: monthlyValues.reduce((sum, m) => sum + m.inquiries, 0),
        },
        peakMonths: {
          bookings: {
            month: months[peakBookingMonth],
            count: maxBookings,
          },
          inquiries: {
            month: months[peakInquiryMonth],
            count: maxInquiries,
          },
        },
        eventTypeBreakdown: eventTypeBreakdown.slice(0, 4),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Analytics GET error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics data." }, { status: 500 });
  }
}
