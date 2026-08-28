/* Supabase connection — the ONE place these values live.
 *
 * If ratings ever stop working, it is almost always this: Supabase pauses
 * free projects after about a week of no traffic and eventually removes them.
 * Check the dashboard at supabase.com first.
 *
 * TO POINT AT A NEW PROJECT: replace the two values below, commit, push.
 * Both the Contact page and the SigEp Ratings page read from here.
 */
window.SUPABASE_URL = 'https://wxkwbnqbqxightbaallr.supabase.co';
window.SUPABASE_KEY = 'sb_publishable_zQ_JwkpIaXip6pqhmerOPw_gpm_3Izc';

/* Escape text that came from a form before putting it in the page.
   Without this, anything a brother types is treated as HTML. */
window.esc = function (s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};
