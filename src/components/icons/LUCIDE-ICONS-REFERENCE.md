# Lucide Icons Quick Reference
Already Available (from lucide-react)

## General
```typescript
import { 
  Home, Building, MapPin, Navigation,
  Settings, Info, HelpCircle, AlertCircle,
  CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
```

## Actions
```typescript
import {
  Plus, Minus, X, Check, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, ArrowRight, ArrowLeft,
  Search, Filter, Download, Upload, Share
} from 'lucide-react';
```

## Energy & Utilities
```typescript
import {
  Zap, Battery, BatteryCharging, Sun, Moon,
  Wind, Droplets, Flame, Snowflake, ThermometerSun
} from 'lucide-react';
```

## Business & Office
```typescript
import {
  Building, Building2, Store, Warehouse,
  ShoppingCart, CreditCard, DollarSign, TrendingUp,
  Users, User, UserPlus, UserCheck
} from 'lucide-react';
```

## Transportation
```typescript
import {
  Car, Truck, Bus, Bike, Ship, Plane,
  Fuel, Navigation, MapPin, Map
} from 'lucide-react';
```

## Time & Calendar
```typescript
import {
  Clock, Calendar, CalendarDays, Timer,
  Hourglass, Watch
} from 'lucide-react';
```

## Communication
```typescript
import {
  Phone, Mail, MessageSquare, Send,
  Bell, BellRing, Volume2, VolumeX
} from 'lucide-react';
```

## Files & Documents
```typescript
import {
  File, FileText, FilePlus, FileCheck,
  Folder, FolderOpen, Save, Download
} from 'lucide-react';
```

## Editing
```typescript
import {
  Edit, Edit2, Edit3, Pencil, Pen,
  Trash, Trash2, Copy, Clipboard
} from 'lucide-react';
```

## Media
```typescript
import {
  Image, Video, Music, Camera, Film,
  Play, Pause, SkipForward, SkipBack
} from 'lucide-react';
```

## Layout
```typescript
import {
  Layout, Grid, List, Columns, Rows,
  Maximize, Minimize, Sidebar, PanelLeft
} from 'lucide-react';
```

## Status
```typescript
import {
  Loader, Loader2, RefreshCw, RotateCw,
  Activity, TrendingUp, TrendingDown,
  BarChart, LineChart, PieChart
} from 'lucide-react';
```

## Security
```typescript
import {
  Lock, Unlock, Key, Shield, ShieldCheck,
  Eye, EyeOff, UserCheck, AlertTriangle
} from 'lucide-react';
```

## Weather
```typescript
import {
  Sun, Moon, Cloud, CloudRain, CloudSnow,
  Wind, Droplets, Thermometer, Sunrise
} from 'lucide-react';
```

## Usage Examples

### Basic Icon
```typescript
import { Zap } from 'lucide-react';

<Zap className="w-6 h-6 text-purple-400" />
```

### Icon with Animation
```typescript
import { Loader2 } from 'lucide-react';

<Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
```

### Icon Button
```typescript
import { Plus } from 'lucide-react';

<button className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500">
  <Plus className="w-5 h-5 text-white" />
</button>
```

### Icon with Text
```typescript
import { Check } from 'lucide-react';

<div className="flex items-center gap-2">
  <Check className="w-5 h-5 text-green-400" />
  <span>Completed</span>
</div>
```

## Size Classes
```typescript
// Tailwind size classes
w-3 h-3  // 12px - tiny icons
w-4 h-4  // 16px - small icons, inline text
w-5 h-5  // 20px - default size
w-6 h-6  // 24px - standard buttons
w-8 h-8  // 32px - large buttons
w-10 h-10 // 40px - hero icons
w-12 h-12 // 48px - featured icons
```

## Color Classes
```typescript
// Purple theme
text-purple-400  // light purple
text-purple-500  // medium purple
text-purple-600  // dark purple

// Status colors
text-green-400   // success
text-red-400     // error
text-yellow-400  // warning
text-blue-400    // info

// Neutral
text-white       // white
text-slate-200   // light gray
text-slate-400   // medium gray
text-slate-600   // dark gray
```

## Common Patterns

### Loading Spinner
```typescript
<Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
```

### Success Checkmark
```typescript
<CheckCircle className="w-6 h-6 text-green-400" />
```

### Error X
```typescript
<XCircle className="w-6 h-6 text-red-400" />
```

### Warning
```typescript
<AlertTriangle className="w-6 h-6 text-yellow-400" />
```

### Info
```typescript
<Info className="w-5 h-5 text-blue-400" />
```

## Accessibility
Always add aria-label for icon-only buttons:
```typescript
<button aria-label="Close">
  <X className="w-5 h-5" />
</button>
```

Or use sr-only text:
```typescript
<button>
  <Plus className="w-5 h-5" />
  <span className="sr-only">Add item</span>
</button>
```
