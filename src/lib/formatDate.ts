import moment from 'moment-timezone';

export function formatDateTime(dateStr: string): string {
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0')
    const month = date.getMonth().toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
  
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
  }

  export function formatDateTimeDisplay(dateStr: string, showTime=true): string {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;

  if (isNaN(date.getTime())) return '-'; 
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]

    const dayName = days[date.getDay()]
    const day = date.getDate()
    const monthName = months[date.getMonth()]
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    // Get ordinal suffix
    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"]
      const v = n % 100
      return s[(v - 20) % 10] || s[v] || s[0]
    }

    const ordinal = getOrdinal(day)

    if(showTime){
      return `${dayName}, ${day}${ordinal} ${monthName}, ${year} ${hours}:${minutes}`
    }
    else{
      return `${dayName}, ${day}${ordinal} ${monthName}, ${year}`
    }
    
  }

  export function getAge(dateStr: string, showDays = true, showMonths = true): string {
    const dob = new Date(dateStr);
    const now = new Date();
  
    if (isNaN(dob.getTime())) {
      return 'Invalid date';
    }
  
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    let days = now.getDate() - dob.getDate();
  
    if (days < 0) {
      months--;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
  
    if (months < 0) {
      years--;
      months += 12;
    }
  
    const parts: string[] = [];
  
    if (years > 0) {
      parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    }
    if (showMonths && months > 0) {
      parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    }
    if (showDays && days > 0) {
      parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    }
  
    return parts.length > 0 ? parts.join(', ') : '0 days';
  }


  export function getCreatedAtId(createdAt: Date): number {
    const pad = (n: number) => String(n).padStart(2, '0')

    const createdAtId = 
      createdAt.getFullYear().toString() +
      pad(createdAt.getMonth() + 1) +
      pad(createdAt.getDate()) +
      pad(createdAt.getHours()) +
      pad(createdAt.getMinutes()) +
      pad(createdAt.getSeconds())
    return parseInt(createdAtId)
  }

  export function getCustomDateTime(utcDate: string, format:string="YYYY-MM-DD", tz:string="Asia/Dhaka"): string {
        return moment.utc(utcDate).tz(tz).format(format);
  }
  