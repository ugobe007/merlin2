# Debug 406 Error - If It Persists After Hard Refresh

## Check Network Request Details

1. **Open DevTools** → Network tab
2. **Filter by**: "pricing_markup"
3. **Look for the failed request**
4. **Check Request Headers:**
   ```
   Should have:
   - apikey: eyJhbGc... (your anon key)
   - Content-Type: application/json
   - Accept: application/json
   ```

5. **Check Response:**
   - Status: 406
   - Response body (might have error details)

## Possible Causes

### Cause 1: Schema Cache Not Refreshed
PostgREST caches the schema. Sometimes needs manual refresh.

**Fix in Supabase Dashboard:**
1. Go to: https://app.supabase.com/project/fvmpmozybmtzjvikrctq/settings/api
2. Click **"Reload Schema Cache"** button
3. Wait 10 seconds
4. Refresh your app

### Cause 2: Service Worker Cache
If you have a service worker, it might be serving old responses.

**Fix:**
1. DevTools → Application tab
2. Service Workers section
3. Click "Unregister" for merlin2.fly.dev
4. Hard refresh (Cmd+Shift+R)

### Cause 3: Supabase Client Configuration
Check if the anon key has proper permissions.

**Verify in code** (`equipmentPricingTiersService.ts`):
```typescript
// Should be using authenticated supabase client
const { data, error } = await supabase
  .from('pricing_markup_config')
  .select('markup_percentage')
  .eq('config_key', equipmentType)
  .eq('is_active', true)
  .single();
```

**Test manually in browser console:**
```javascript
// Replace with your actual anon key from .env
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

fetch('https://fvmpmozybmtzjvikrctq.supabase.co/rest/v1/pricing_markup_config?select=*', {
  headers: {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

If this works, the issue is in your app's Supabase client setup.

### Cause 4: RLS Policy Issue (Unlikely)
Even though we set `USING (true)`, verify the policies exist:

**Run in Supabase SQL Editor:**
```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'pricing_markup_config';
```

Should show:
- `pricing_markup_config_read` with cmd='SELECT' and qual='true'
- `pricing_markup_config_write` with cmd='ALL'

## Quick Diagnostic Commands

**Test 1: Table exists and has data**
```sql
SELECT COUNT(*), config_key FROM pricing_markup_config GROUP BY config_key;
```
Should return 15 rows.

**Test 2: RLS is properly configured**
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'pricing_markup_config';
```
Should show `rowsecurity = true`.

**Test 3: Anonymous can read**
```sql
SET ROLE anon;
SELECT * FROM pricing_markup_config LIMIT 1;
RESET ROLE;
```
Should return 1 row without error.

## Still Not Working?

If none of the above fixes it, there might be a PostgREST version issue. Try this workaround:

**Create a database function as a workaround:**
```sql
CREATE OR REPLACE FUNCTION get_markup_percentage(p_equipment_type text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT markup_percentage 
    FROM pricing_markup_config 
    WHERE config_key = p_equipment_type 
      AND is_active = true
    LIMIT 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_markup_percentage TO anon, authenticated;
```

Then call it via RPC instead of direct table access.

---

**Most likely**: Just need a hard refresh to clear cached 406 responses! 🔄
