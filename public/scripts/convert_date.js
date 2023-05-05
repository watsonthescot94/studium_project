function convertDateToDayMonthYearString(date_string) {
    let date = new Date(date_string);
    let day = date.getUTCDate();
    let month = date.getUTCMonth() + 1;
    let year = date.getUTCFullYear();
    let month_string = "";

    switch (month) {
        case 1:
            month_string = "January";
            break;
        case 2:
            month_string = "February";
            break;
        case 3:
            month_string = "March";
            break;
        case 4:
            month_string = "April";
            break;
        case 5:
            month_string = "May";
            break;
        case 6:
            month_string = "June";
            break;
        case 7:
            month_string = "July";
            break;
        case 8:
            month_string = "August";
            break;
        case 9:
            month_string = "September";
            break;
        case 10:
            month_string = "October";
            break;
        case 11:
            month_string = "November";
            break;
        case 12:
            month_string = "December";
    }

    return day + " " + month_string + " " + year;
}