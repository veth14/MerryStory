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

    // Helper functions to get month and year from date
    const getMonth = (date: Date | string | undefined): number => {
      if (!date) return 0;
      const d = new Date(date);
      return d.getMonth();
    };

    const getYear = (date: Date | string | undefined): number => {
      if (!date) return new Date().getFullYear();
      const d = new Date(date);
      return d.getFullYear();
    };

    // Group bookings (events) by month and year
    const bookingsByMonthYear: { [key: string]: number } = {};
    const bookingsByYear: { [key: number]: number } = {};
    events.forEach(event => {
      const month = getMonth(event.createdAt);
      const year = getYear(event.createdAt);
      const key = `${year}-${month}`;
      bookingsByMonthYear[key] = (bookingsByMonthYear[key] || 0) + 1;
      bookingsByYear[year] = (bookingsByYear[year] || 0) + 1;
    });

    // Group inquiries by month and year
    const inquiriesByMonthYear: { [key: string]: number } = {};
    const inquiriesByYear: { [key: number]: number } = {};
    inquiries.forEach(inq => {
      const month = getMonth(inq.submitted);
      const year = getYear(inq.submitted);
      const key = `${year}-${month}`;
      inquiriesByMonthYear[key] = (inquiriesByMonthYear[key] || 0) + 1;
      inquiriesByYear[year] = (inquiriesByYear[year] || 0) + 1;
    });

    // Group events by type and frequency for current year
    const eventTypeByFrequency: {
      monthly: { [key: number]: { [type: string]: { bookings: number; inquiries: number } } };
      quarterly: { [key: number]: { [type: string]: { bookings: number; inquiries: number } } };
      halfYear: { [key: number]: { [type: string]: { bookings: number; inquiries: number } } };
      annual: { [type: string]: { bookings: number; inquiries: number } };
    } = {
      monthly: {},
      quarterly: {},
      halfYear: {},
      annual: {}
    };

    const currentYear = new Date().getFullYear();

    // Helper to normalize type names
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

    const normalizeType = (type: string): string => {
      return typeMapping[type.toLowerCase()] || type;
    };

    // Group bookings and inquiries by type and month for current year
    events.forEach(event => {
      const year = getYear(event.createdAt);
      if (year !== currentYear) return;
      
      const month = getMonth(event.createdAt);
      const type = normalizeType(event.type || 'Other');
      const quarter = Math.floor(month / 3);
      const half = Math.floor(month / 6);

      // Monthly
      if (!eventTypeByFrequency.monthly[month]) eventTypeByFrequency.monthly[month] = {};
      if (!eventTypeByFrequency.monthly[month][type]) eventTypeByFrequency.monthly[month][type] = { bookings: 0, inquiries: 0 };
      eventTypeByFrequency.monthly[month][type].bookings += 1;

      // Quarterly
      if (!eventTypeByFrequency.quarterly[quarter]) eventTypeByFrequency.quarterly[quarter] = {};
      if (!eventTypeByFrequency.quarterly[quarter][type]) eventTypeByFrequency.quarterly[quarter][type] = { bookings: 0, inquiries: 0 };
      eventTypeByFrequency.quarterly[quarter][type].bookings += 1;

      // Half-Year
      if (!eventTypeByFrequency.halfYear[half]) eventTypeByFrequency.halfYear[half] = {};
      if (!eventTypeByFrequency.halfYear[half][type]) eventTypeByFrequency.halfYear[half][type] = { bookings: 0, inquiries: 0 };
      eventTypeByFrequency.halfYear[half][type].bookings += 1;

      // Annual
      if (!eventTypeByFrequency.annual[type]) eventTypeByFrequency.annual[type] = { bookings: 0, inquiries: 0 };
      eventTypeByFrequency.annual[type].bookings += 1;
    });

    inquiries.forEach(inq => {
      const year = getYear(inq.submitted);
      if (year !== currentYear) return;
      
      const month = getMonth(inq.submitted);
      const type = normalizeType(inq.eventType || 'Other');
      const quarter = Math.floor(month / 3);
      const half = Math.floor(month / 6);

      // Monthly
      if (!eventTypeByFrequency.monthly[month]) eventTypeByFrequency.monthly[month] = {};
      if (!eventTypeByFrequency.monthly[month][type]) eventTypeByFrequency.monthly[month][type] = { bookings: 0, inquiries: 0 };
      eventTypeByFrequency.monthly[month][type].inquiries += 1;

      // Quarterly
      if (!eventTypeByFrequency.quarterly[quarter]) eventTypeByFrequency.quarterly[quarter] = {};
      if (!eventTypeByFrequency.quarterly[quarter][type]) eventTypeByFrequency.quarterly[quarter][type] = { bookings: 0, inquiries: 0 };
      eventTypeByFrequency.quarterly[quarter][type].inquiries += 1;

      // Half-Year
      if (!eventTypeByFrequency.halfYear[half]) eventTypeByFrequency.halfYear[half] = {};
      if (!eventTypeByFrequency.halfYear[half][type]) eventTypeByFrequency.halfYear[half][type] = { bookings: 0, inquiries: 0 };
      eventTypeByFrequency.halfYear[half][type].inquiries += 1;

      // Annual
      if (!eventTypeByFrequency.annual[type]) eventTypeByFrequency.annual[type] = { bookings: 0, inquiries: 0 };
      eventTypeByFrequency.annual[type].inquiries += 1;
    });

    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const shortMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Generate monthly frequency data (normalized to 0-100 scale)
    const monthlyValues = Array.from({ length: 12 }, (_, i) => {
      const key = `${currentYear}-${i}`;
      return {
        bookings: bookingsByMonthYear[key] || 0,
        inquiries: inquiriesByMonthYear[key] || 0,
      };
    });

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

    // Generate annual (5 years) data with current year in middle
    const yearRange = 5;
    const middleIndex = Math.floor(yearRange / 2);
    const annualFrequency = [];
    for (let i = 0; i < yearRange; i++) {
      const year = currentYear - middleIndex + i;
      const yearBookings = bookingsByYear[year] || 0;
      const yearInquiries = inquiriesByYear[year] || 0;
      annualFrequency.push({
        label: year.toString(),
        bookings: 0,
        inquiries: 0,
        actualBookings: yearBookings,
        actualInquiries: yearInquiries,
      });
    }

    // Normalize annual data
    const maxAnnualValue = Math.max(...annualFrequency.map(y => Math.max(y.actualBookings, y.actualInquiries)), 1);
    annualFrequency.forEach(year => {
      year.bookings = Math.round((year.actualBookings / maxAnnualValue) * 100);
      year.inquiries = Math.round((year.actualInquiries / maxAnnualValue) * 100);
    });

    // Find peak months for bookings and inquiries (current year)
    let peakBookingMonth = 0;
    let maxBookings = 0;
    let peakInquiryMonth = 0;
    let maxInquiries = 0;

    monthlyValues.forEach((month, idx) => {
      if (month.bookings > maxBookings) {
        maxBookings = month.bookings;
        peakBookingMonth = idx;
      }
      if (month.inquiries > maxInquiries) {
        maxInquiries = month.inquiries;
        peakInquiryMonth = idx;
      }
    });

    // Count event types - ALL DATA (not filtered by year)
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

    const normalizedTypes: { [key: string]: { bookings: number; inquiries: number } } = {};
    Object.entries(eventTypeData).forEach(([type, counts]) => {
      const normalizedType = normalizeType(type);
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
        annualFrequency,
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
        eventTypeByFrequency,
        currentYear,
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
