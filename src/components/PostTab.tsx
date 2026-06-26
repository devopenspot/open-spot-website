import React, { useState } from 'react';
import { PlusCircle, MapPin, Check, Image as ImageIcon, Camera, Trash2, Tag, Compass } from 'lucide-react';
import { Spot } from '../types';

interface PostTabProps {
  onAddSpot: (spot: Spot) => void;
  onNavigateToExplore: () => void;
}

// Pre-curated street photography images to avoid broken links
const DEFAULT_PRESET_IMAGES = [
  {
    name: 'Industrial Ledge',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzOoxxgf8dF_dffEyj1reX-fHjpbmdOzHCKt48IV55g3OcOejsIT9MtaySQEK0hVzvIpPegtGd03j4neTRFC5WGxsEvj5OLJpKfFMhwXdXIY2YAjpD2xwCUOFNv_jCUBDs7mrLeq2J28upIy9Q7fq5m46ytFrpE8efxEcvW-3Bdb4uiMD6QOxExLVPlkQMkRDVmB2DxRfKq8E3Y0pko6HLf3oSNBxhmT5BnVuJ8tSMUEgWQuk_WElNP9xvvc9URbMql80pPwHFxf9P'
  },
  {
    name: 'Metro Underpass',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6GHeF7oipibYvoiyBsC4TPFku7ffQmv6y0B5AvgdhgAmG9pI0BlJLe8-ayJLMlAtDAWwUGu4FAwabH8HuELRowJ3IeEJOlgw4xvg0_RP_eRKPr5eESG5TxVwONEulq3jToyCXr01mrPooWxd_LZyIm1ZjLx-q5OyZPARNZVw0jmm6gY0B_2wuE2kir3siF7K3C7ntb79Rqd-JOHOOpenTRYBWA1KQLZ_r4WVgfahEkzWayr4xRHIqIgYUCuuxsceSaEpXp8segQIg'
  },
  {
    name: 'Marble Stair Run',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrY2kzLB1jQqPxx87OqENxBTnqO00sGNmmbFTu7AVZ6r19NZg7MF3fdWdWnI6gGfw_ffMIMDY_Gspts-w017UN_NrCfiVCFhy5StEGoec3EzYvqmTmbz4lzOgjKciS7RV27IOlPVKHiEzli-wdFgHIurqHwm2HE4kDZQEjudqZODIx-_RyULGF_RgAiTpitlMRoYMh6eCL773msOXd0D2xWpsxVBURfxsElH5AvNf3rqCohSNZhAbWwTXOJZZxwY3ShaMJiJ95FWS2'
  },
  {
    name: 'Desert Basin Ditch',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFcsJ_InsjM_V2ZhdORVirVciKPJ2Uqt5Jii3nfPULenttPQ0cUQzaa_C0Yc_NrAv1eAnHIeR8S04LjqVjCQuleF60loO-Mh7UEOwa--QIQwv3VaR_P4gt5B7jfu-3GeKqm5Rf-NV8q0xJxL_FX9JZR0_YLkAMpHPWfXRNDr5THXJbJawrNxG5oJYPI2YICMJAFHJPsYpbPdVHU8lTuqhXRgmObg3ZuVD7VNiZ6NjRXmQfSSW7vx2q43JFz7ckBgTcpMPRzkp67YMT'
  }
];

export default function PostTab({
  onAddSpot,
  onNavigateToExplore,
}: PostTabProps) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('Plaza');
  const [imageUrl, setImageUrl] = useState(DEFAULT_PRESET_IMAGES[0].url);
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [communityNote, setCommunityNote] = useState('');
  const [featuresInput, setFeaturesInput] = useState('');
  const [featuresList, setFeaturesList] = useState<string[]>(['Transition', 'Smooth Concrete']);
  const [crowdLevel, setCrowdLevel] = useState<number>(35);

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAddFeature = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = featuresInput.trim();
    if (trimmed && !featuresList.includes(trimmed)) {
      setFeaturesList([...featuresList, trimmed]);
      setFeaturesInput('');
    }
  };

  const handleRemoveFeature = (f: string) => {
    setFeaturesList(featuresList.filter(item => item !== f));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city || !address) {
      alert('Please fill in the required fields: Name, City, and Address.');
      return;
    }

    // Generate coordinate roughly near center of LA simulated board (coords: 40-60)
    const randomCoordX = Math.floor(Math.random() * 20) + 40;
    const randomCoordY = Math.floor(Math.random() * 20) + 40;

    const newSpot: Spot = {
      id: `custom-spot-${Date.now()}`,
      name: name.toUpperCase(),
      city,
      address,
      type,
      distance: '0.5 MILES AWAY',
      coordinates: { x: randomCoordX, y: randomCoordY },
      image: imageUrl,
      features: featuresList,
      crowdLevel: crowdLevel,
      crowdLevelLabel: crowdLevel > 70 ? 'High (Busy)' : crowdLevel > 40 ? 'Moderate Activity' : 'Low Crowd (Ideal)',
      weather: {
        current: 23,
        forecast: [
          { day: 'TUE', icon: 'sunny', temp: 22 },
          { day: 'WED', icon: 'partly_cloudy_day', temp: 20 },
          { day: 'THU', icon: 'sunny', temp: 23 }
        ]
      },
      communityNote: communityNote || 'Contributed by community scout. Bring your setup and session on! — @anonymous_rider'
    };

    onAddSpot(newSpot);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div id="post-success-panel" className="max-w-md mx-auto py-16 text-center animate-fade-in">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-6">
          <Check size={28} className="text-primary animate-pulse" />
        </div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-widest text-on-surface">
          SPOT REGISTERED
        </h2>
        <p className="mt-2 text-xs text-secondary leading-relaxed">
          Your street coordinates and terrain specifications have been cataloged on the master map! Skaters can now scout this location live.
        </p>

        <div className="mt-8 flex flex-col gap-2.5">
          <button
            onClick={() => {
              setIsSubmitted(false);
              setName('');
              setCity('');
              setAddress('');
              setType('Plaza');
              setCommunityNote('');
              setFeaturesList(['Transition', 'Smooth Concrete']);
            }}
            className="w-full bg-on-surface text-surface py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all"
          >
            POST ANOTHER PLOT
          </button>
          
          <button
            onClick={onNavigateToExplore}
            className="w-full border border-outline text-on-surface py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-surface-container transition-all"
          >
            RETURN TO DIRECTORY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="post-tab" className="max-w-3xl mx-auto pb-24 animate-fade-in">
      <div className="border-b border-outline-variant pb-5 mb-8">
        <span className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase block mb-1">
          CONTRIBUTE TO CARTOGRAPHY
        </span>
        <h2 className="font-display text-2xl font-bold tracking-tight text-on-surface uppercase sm:text-3xl">
          REGISTER NEW OBSTACLE
        </h2>
        <p className="mt-1.5 text-xs text-secondary leading-relaxed">
          Map your local ledges, stairs, DIYs, or pools. Provide accurate metadata to help fellow skaters coordinate sessions safely.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Row 1: Basic Identifiers */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5">
              SPOT NAME *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. THE WHITE MARBLE NINE"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5">
              TERRAIN TYPE *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
            >
              <option value="Plaza">PLAZA</option>
              <option value="DIY">DIY</option>
              <option value="Stair">STAIR SET</option>
              <option value="Bowl">BOWL</option>
              <option value="Park">SKATEPARK</option>
              <option value="Ledges">LEDGES</option>
              <option value="Pools">POOLS</option>
            </select>
          </div>
        </div>

        {/* Row 2: Location specs */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5">
              CITY *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Los Angeles, CA"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5">
              EXACT ADDRESS *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Hope Street Corporate Row, L.A."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
            />
          </div>
        </div>

        {/* Section 3: Visual banner selection (preset vs custom) */}
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
          <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary mb-3 flex items-center">
            <ImageIcon size={12} className="mr-1.5 text-secondary" />
            VISUAL BANNER SOURCE (CHOOSE A PRESET OR SUBMIT URL)
          </label>

          {/* Preset Images Grid Selection */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
            {DEFAULT_PRESET_IMAGES.map((preset, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedPreset(idx);
                  setImageUrl(preset.url);
                }}
                className={`relative h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedPreset === idx ? 'border-primary ring-2 ring-primary/10' : 'border-transparent'
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover filter grayscale"
                />
                <div className="absolute inset-0 bg-black/40" />
                <span className="absolute bottom-1.5 left-2 right-2 text-[8px] font-bold uppercase tracking-wider text-white text-center truncate">
                  {preset.name}
                </span>
                {selectedPreset === idx && (
                  <div className="absolute top-1.5 right-1.5 bg-primary rounded-full p-0.5 text-white">
                    <Check size={8} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Custom URL Input if needed */}
          <div>
            <span className="block text-[10px] text-secondary font-semibold font-mono mb-1">
              OR SPECIFY CUSTOM IMAGE URL
            </span>
            <input
              type="text"
              placeholder="Paste custom hotlink image URL here..."
              value={imageUrl}
              onChange={(e) => {
                setSelectedPreset(-1); // Deselect presets
                setImageUrl(e.target.value);
              }}
              className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
            />
          </div>
        </div>

        {/* Row 4: Live crowd approximation */}
        <div>
          <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5">
            CROWD APPROXIMATION ({crowdLevel}% OCCUPANCY)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={crowdLevel}
            onChange={(e) => setCrowdLevel(Number(e.target.value))}
            className="w-full accent-primary bg-outline-variant h-1 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-secondary mt-1">
            <span>0% (EMPTY)</span>
            <span>50% (MODERATE)</span>
            <span>100% (PRIME TIME / CLOGGED)</span>
          </div>
        </div>

        {/* Row 5: Features List and custom creation */}
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
          <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary mb-3 flex items-center">
            <Tag size={12} className="mr-1.5" />
            OBSTACLE SPECIFICATIONS / FEATURES
          </label>

          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              placeholder="Add tag (e.g. Red Curb, Slappy, Waxed)"
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              className="flex-1 rounded-lg border border-outline-variant bg-surface-bright px-3 py-2 text-xs font-medium text-on-surface focus:outline-none focus:border-outline"
            />
            <button
              type="button"
              onClick={handleAddFeature}
              className="bg-on-surface text-surface px-4 rounded-lg text-xs font-bold tracking-wider uppercase hover:bg-on-surface/90 transition-all"
            >
              ADD
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {featuresList.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full bg-surface-container-high border border-outline-variant/60 px-3 py-1 text-[10px] font-semibold text-on-surface"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(tag)}
                  className="ml-1.5 text-secondary hover:text-red-500 font-bold text-xs"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Row 6: Community Intel */}
        <div>
          <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5">
            COMMUNITY INTEL / LOCAL NOTES
          </label>
          <textarea
            rows={3}
            placeholder="Describe runway smoothness, security timing, wax needs, lighting, etc..."
            value={communityNote}
            onChange={(e) => setCommunityNote(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
          />
        </div>

        {/* Submit */}
        <div className="border-t border-outline-variant pt-5 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onNavigateToExplore}
            className="px-6 py-3 rounded-lg border border-outline text-xs font-bold tracking-widest uppercase hover:bg-surface-container transition-all"
          >
            CANCEL
          </button>
          <button
            type="submit"
            className="px-8 py-3 rounded-lg bg-on-surface text-surface text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all shadow-md"
          >
            REGISTER PLOT
          </button>
        </div>
      </form>
    </div>
  );
}
