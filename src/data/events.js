const baseEvents = [
  {
    title: 'Success Celebrations SPARK 2024',
    location: 'Delhi',
    date: '29 Dec 2024',
    img: 'https://mirrikh.com/wp-content/uploads/2025/01/SPARK-2024-thumbnail.jpg',
  },
  {
    title: 'Achiever\'s Celebration',
    location: 'Delhi',
    date: '17 Sept 2023',
    img: 'https://mirrikh.com/wp-content/uploads/2025/01/banner-event-17-Sept-2023-1.jpg',
  },
  {
    title: 'Dholera Awareness Program',
    location: 'Gurgaon',
    date: '30 Apr 2023',
    img: 'https://mirrikh.com/wp-content/uploads/2025/01/dholera-awareness-program.jpg',
  },
  {
    title: 'Holi Milan Samaroh',
    location: 'Surat',
    date: '04 Mar 2023',
    img: 'https://mirrikh.com/wp-content/uploads/2025/01/Holi-Milan-Samaroh-3.jpg',
  },
  {
    title: 'Riyadh Real Estate Exhibition',
    location: 'Saudi Arabia',
    date: '02 Feb 2023',
    img: 'https://mirrikh.com/wp-content/uploads/2025/01/mirrikh-events-exhibition-4.jpg',
  }
];

let expandedEvents = [...baseEvents];
while(expandedEvents.length < 36) { // 4 pages
  expandedEvents.push(...baseEvents.slice(0, 36 - expandedEvents.length));
}

export const events = expandedEvents;