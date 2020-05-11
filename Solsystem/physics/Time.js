export function getJ2000(UNIX_time) {
    var a = new Date(UNIX_time);

    var y = a.getFullYear() - 2000;
    var m = a.getMonth();
    var D = a.getDate();
    var UT = a.getHours() + a.getMinutes()/60;

    d = 367*y - 7 * ( y + (m+9)/12 ) / 4 + 275*m/9 + D - 730530;

    return d;
}
