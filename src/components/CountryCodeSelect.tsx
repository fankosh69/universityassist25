import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const countries = [
  // Priority countries
  { value: "+20", label: "🇪🇬 Egypt (+20)", country: "Egypt" },
  { value: "+971", label: "🇦🇪 UAE (+971)", country: "UAE" },
  { value: "+966", label: "🇸🇦 Saudi Arabia (+966)", country: "Saudi Arabia" },
  // Other countries
  { value: "+93", label: "🇦🇫 Afghanistan (+93)", country: "Afghanistan" },
  { value: "+355", label: "🇦🇱 Albania (+355)", country: "Albania" },
  { value: "+213", label: "🇩🇿 Algeria (+213)", country: "Algeria" },
  { value: "+1684", label: "🇦🇸 American Samoa (+1684)", country: "American Samoa" },
  { value: "+376", label: "🇦🇩 Andorra (+376)", country: "Andorra" },
  { value: "+244", label: "🇦🇴 Angola (+244)", country: "Angola" },
  { value: "+1264", label: "🇦🇮 Anguilla (+1264)", country: "Anguilla" },
  { value: "+672", label: "🇦🇶 Antarctica (+672)", country: "Antarctica" },
  { value: "+1268", label: "🇦🇬 Antigua and Barbuda (+1268)", country: "Antigua and Barbuda" },
  { value: "+54", label: "🇦🇷 Argentina (+54)", country: "Argentina" },
  { value: "+374", label: "🇦🇲 Armenia (+374)", country: "Armenia" },
  { value: "+297", label: "🇦🇼 Aruba (+297)", country: "Aruba" },
  { value: "+61", label: "🇦🇺 Australia (+61)", country: "Australia" },
  { value: "+43", label: "🇦🇹 Austria (+43)", country: "Austria" },
  { value: "+994", label: "🇦🇿 Azerbaijan (+994)", country: "Azerbaijan" },
  { value: "+1242", label: "🇧🇸 Bahamas (+1242)", country: "Bahamas" },
  { value: "+973", label: "🇧🇭 Bahrain (+973)", country: "Bahrain" },
  { value: "+880", label: "🇧🇩 Bangladesh (+880)", country: "Bangladesh" },
  { value: "+1246", label: "🇧🇧 Barbados (+1246)", country: "Barbados" },
  { value: "+375", label: "🇧🇾 Belarus (+375)", country: "Belarus" },
  { value: "+32", label: "🇧🇪 Belgium (+32)", country: "Belgium" },
  { value: "+501", label: "🇧🇿 Belize (+501)", country: "Belize" },
  { value: "+229", label: "🇧🇯 Benin (+229)", country: "Benin" },
  { value: "+1441", label: "🇧🇲 Bermuda (+1441)", country: "Bermuda" },
  { value: "+975", label: "🇧🇹 Bhutan (+975)", country: "Bhutan" },
  { value: "+591", label: "🇧🇴 Bolivia (+591)", country: "Bolivia" },
  { value: "+387", label: "🇧🇦 Bosnia and Herzegovina (+387)", country: "Bosnia and Herzegovina" },
  { value: "+267", label: "🇧🇼 Botswana (+267)", country: "Botswana" },
  { value: "+55", label: "🇧🇷 Brazil (+55)", country: "Brazil" },
  { value: "+246", label: "🇮🇴 British Indian Ocean Territory (+246)", country: "British Indian Ocean Territory" },
  { value: "+673", label: "🇧🇳 Brunei (+673)", country: "Brunei" },
  { value: "+359", label: "🇧🇬 Bulgaria (+359)", country: "Bulgaria" },
  { value: "+226", label: "🇧🇫 Burkina Faso (+226)", country: "Burkina Faso" },
  { value: "+257", label: "🇧🇮 Burundi (+257)", country: "Burundi" },
  { value: "+855", label: "🇰🇭 Cambodia (+855)", country: "Cambodia" },
  { value: "+237", label: "🇨🇲 Cameroon (+237)", country: "Cameroon" },
  { value: "+1", label: "🇨🇦 Canada (+1)", country: "Canada" },
  { value: "+238", label: "🇨🇻 Cape Verde (+238)", country: "Cape Verde" },
  { value: "+1345", label: "🇰🇾 Cayman Islands (+1345)", country: "Cayman Islands" },
  { value: "+236", label: "🇨🇫 Central African Republic (+236)", country: "Central African Republic" },
  { value: "+235", label: "🇹🇩 Chad (+235)", country: "Chad" },
  { value: "+56", label: "🇨🇱 Chile (+56)", country: "Chile" },
  { value: "+86", label: "🇨🇳 China (+86)", country: "China" },
  { value: "+57", label: "🇨🇴 Colombia (+57)", country: "Colombia" },
  { value: "+269", label: "🇰🇲 Comoros (+269)", country: "Comoros" },
  { value: "+243", label: "🇨🇩 Congo (DRC) (+243)", country: "Congo (DRC)" },
  { value: "+242", label: "🇨🇬 Congo (+242)", country: "Congo" },
  { value: "+682", label: "🇨🇰 Cook Islands (+682)", country: "Cook Islands" },
  { value: "+506", label: "🇨🇷 Costa Rica (+506)", country: "Costa Rica" },
  { value: "+225", label: "🇨🇮 Côte d'Ivoire (+225)", country: "Côte d'Ivoire" },
  { value: "+385", label: "🇭🇷 Croatia (+385)", country: "Croatia" },
  { value: "+53", label: "🇨🇺 Cuba (+53)", country: "Cuba" },
  { value: "+357", label: "🇨🇾 Cyprus (+357)", country: "Cyprus" },
  { value: "+420", label: "🇨🇿 Czech Republic (+420)", country: "Czech Republic" },
  { value: "+45", label: "🇩🇰 Denmark (+45)", country: "Denmark" },
  { value: "+253", label: "🇩🇯 Djibouti (+253)", country: "Djibouti" },
  { value: "+1767", label: "🇩🇲 Dominica (+1767)", country: "Dominica" },
  { value: "+1809", label: "🇩🇴 Dominican Republic (+1809)", country: "Dominican Republic" },
  { value: "+593", label: "🇪🇨 Ecuador (+593)", country: "Ecuador" },
  { value: "+503", label: "🇸🇻 El Salvador (+503)", country: "El Salvador" },
  { value: "+240", label: "🇬🇶 Equatorial Guinea (+240)", country: "Equatorial Guinea" },
  { value: "+291", label: "🇪🇷 Eritrea (+291)", country: "Eritrea" },
  { value: "+372", label: "🇪🇪 Estonia (+372)", country: "Estonia" },
  { value: "+251", label: "🇪🇹 Ethiopia (+251)", country: "Ethiopia" },
  { value: "+500", label: "🇫🇰 Falkland Islands (+500)", country: "Falkland Islands" },
  { value: "+298", label: "🇫🇴 Faroe Islands (+298)", country: "Faroe Islands" },
  { value: "+679", label: "🇫🇯 Fiji (+679)", country: "Fiji" },
  { value: "+358", label: "🇫🇮 Finland (+358)", country: "Finland" },
  { value: "+33", label: "🇫🇷 France (+33)", country: "France" },
  { value: "+594", label: "🇬🇫 French Guiana (+594)", country: "French Guiana" },
  { value: "+689", label: "🇵🇫 French Polynesia (+689)", country: "French Polynesia" },
  { value: "+241", label: "🇬🇦 Gabon (+241)", country: "Gabon" },
  { value: "+220", label: "🇬🇲 Gambia (+220)", country: "Gambia" },
  { value: "+995", label: "🇬🇪 Georgia (+995)", country: "Georgia" },
  { value: "+49", label: "🇩🇪 Germany (+49)", country: "Germany" },
  { value: "+233", label: "🇬🇭 Ghana (+233)", country: "Ghana" },
  { value: "+350", label: "🇬🇮 Gibraltar (+350)", country: "Gibraltar" },
  { value: "+30", label: "🇬🇷 Greece (+30)", country: "Greece" },
  { value: "+299", label: "🇬🇱 Greenland (+299)", country: "Greenland" },
  { value: "+1473", label: "🇬🇩 Grenada (+1473)", country: "Grenada" },
  { value: "+590", label: "🇬🇵 Guadeloupe (+590)", country: "Guadeloupe" },
  { value: "+1671", label: "🇬🇺 Guam (+1671)", country: "Guam" },
  { value: "+502", label: "🇬🇹 Guatemala (+502)", country: "Guatemala" },
  { value: "+44", label: "🇬🇬 Guernsey (+44)", country: "Guernsey" },
  { value: "+224", label: "🇬🇳 Guinea (+224)", country: "Guinea" },
  { value: "+245", label: "🇬🇼 Guinea-Bissau (+245)", country: "Guinea-Bissau" },
  { value: "+592", label: "🇬🇾 Guyana (+592)", country: "Guyana" },
  { value: "+509", label: "🇭🇹 Haiti (+509)", country: "Haiti" },
  { value: "+504", label: "🇭🇳 Honduras (+504)", country: "Honduras" },
  { value: "+852", label: "🇭🇰 Hong Kong (+852)", country: "Hong Kong" },
  { value: "+36", label: "🇭🇺 Hungary (+36)", country: "Hungary" },
  { value: "+354", label: "🇮🇸 Iceland (+354)", country: "Iceland" },
  { value: "+91", label: "🇮🇳 India (+91)", country: "India" },
  { value: "+62", label: "🇮🇩 Indonesia (+62)", country: "Indonesia" },
  { value: "+98", label: "🇮🇷 Iran (+98)", country: "Iran" },
  { value: "+964", label: "🇮🇶 Iraq (+964)", country: "Iraq" },
  { value: "+353", label: "🇮🇪 Ireland (+353)", country: "Ireland" },
  { value: "+44", label: "🇮🇲 Isle of Man (+44)", country: "Isle of Man" },
  { value: "+972", label: "🇮🇱 Israel (+972)", country: "Israel" },
  { value: "+39", label: "🇮🇹 Italy (+39)", country: "Italy" },
  { value: "+1876", label: "🇯🇲 Jamaica (+1876)", country: "Jamaica" },
  { value: "+81", label: "🇯🇵 Japan (+81)", country: "Japan" },
  { value: "+44", label: "🇯🇪 Jersey (+44)", country: "Jersey" },
  { value: "+962", label: "🇯🇴 Jordan (+962)", country: "Jordan" },
  { value: "+7", label: "🇰🇿 Kazakhstan (+7)", country: "Kazakhstan" },
  { value: "+254", label: "🇰🇪 Kenya (+254)", country: "Kenya" },
  { value: "+686", label: "🇰🇮 Kiribati (+686)", country: "Kiribati" },
  { value: "+850", label: "🇰🇵 North Korea (+850)", country: "North Korea" },
  { value: "+82", label: "🇰🇷 South Korea (+82)", country: "South Korea" },
  { value: "+965", label: "🇰🇼 Kuwait (+965)", country: "Kuwait" },
  { value: "+996", label: "🇰🇬 Kyrgyzstan (+996)", country: "Kyrgyzstan" },
  { value: "+856", label: "🇱🇦 Laos (+856)", country: "Laos" },
  { value: "+371", label: "🇱🇻 Latvia (+371)", country: "Latvia" },
  { value: "+961", label: "🇱🇧 Lebanon (+961)", country: "Lebanon" },
  { value: "+266", label: "🇱🇸 Lesotho (+266)", country: "Lesotho" },
  { value: "+231", label: "🇱🇷 Liberia (+231)", country: "Liberia" },
  { value: "+218", label: "🇱🇾 Libya (+218)", country: "Libya" },
  { value: "+423", label: "🇱🇮 Liechtenstein (+423)", country: "Liechtenstein" },
  { value: "+370", label: "🇱🇹 Lithuania (+370)", country: "Lithuania" },
  { value: "+352", label: "🇱🇺 Luxembourg (+352)", country: "Luxembourg" },
  { value: "+853", label: "🇲🇴 Macao (+853)", country: "Macao" },
  { value: "+389", label: "🇲🇰 North Macedonia (+389)", country: "North Macedonia" },
  { value: "+261", label: "🇲🇬 Madagascar (+261)", country: "Madagascar" },
  { value: "+265", label: "🇲🇼 Malawi (+265)", country: "Malawi" },
  { value: "+60", label: "🇲🇾 Malaysia (+60)", country: "Malaysia" },
  { value: "+960", label: "🇲🇻 Maldives (+960)", country: "Maldives" },
  { value: "+223", label: "🇲🇱 Mali (+223)", country: "Mali" },
  { value: "+356", label: "🇲🇹 Malta (+356)", country: "Malta" },
  { value: "+692", label: "🇲🇭 Marshall Islands (+692)", country: "Marshall Islands" },
  { value: "+596", label: "🇲🇶 Martinique (+596)", country: "Martinique" },
  { value: "+222", label: "🇲🇷 Mauritania (+222)", country: "Mauritania" },
  { value: "+230", label: "🇲🇺 Mauritius (+230)", country: "Mauritius" },
  { value: "+262", label: "🇾🇹 Mayotte (+262)", country: "Mayotte" },
  { value: "+52", label: "🇲🇽 Mexico (+52)", country: "Mexico" },
  { value: "+691", label: "🇫🇲 Micronesia (+691)", country: "Micronesia" },
  { value: "+373", label: "🇲🇩 Moldova (+373)", country: "Moldova" },
  { value: "+377", label: "🇲🇨 Monaco (+377)", country: "Monaco" },
  { value: "+976", label: "🇲🇳 Mongolia (+976)", country: "Mongolia" },
  { value: "+382", label: "🇲🇪 Montenegro (+382)", country: "Montenegro" },
  { value: "+1664", label: "🇲🇸 Montserrat (+1664)", country: "Montserrat" },
  { value: "+212", label: "🇲🇦 Morocco (+212)", country: "Morocco" },
  { value: "+258", label: "🇲🇿 Mozambique (+258)", country: "Mozambique" },
  { value: "+95", label: "🇲🇲 Myanmar (+95)", country: "Myanmar" },
  { value: "+264", label: "🇳🇦 Namibia (+264)", country: "Namibia" },
  { value: "+674", label: "🇳🇷 Nauru (+674)", country: "Nauru" },
  { value: "+977", label: "🇳🇵 Nepal (+977)", country: "Nepal" },
  { value: "+31", label: "🇳🇱 Netherlands (+31)", country: "Netherlands" },
  { value: "+687", label: "🇳🇨 New Caledonia (+687)", country: "New Caledonia" },
  { value: "+64", label: "🇳🇿 New Zealand (+64)", country: "New Zealand" },
  { value: "+505", label: "🇳🇮 Nicaragua (+505)", country: "Nicaragua" },
  { value: "+227", label: "🇳🇪 Niger (+227)", country: "Niger" },
  { value: "+234", label: "🇳🇬 Nigeria (+234)", country: "Nigeria" },
  { value: "+683", label: "🇳🇺 Niue (+683)", country: "Niue" },
  { value: "+672", label: "🇳🇫 Norfolk Island (+672)", country: "Norfolk Island" },
  { value: "+1670", label: "🇲🇵 Northern Mariana Islands (+1670)", country: "Northern Mariana Islands" },
  { value: "+47", label: "🇳🇴 Norway (+47)", country: "Norway" },
  { value: "+968", label: "🇴🇲 Oman (+968)", country: "Oman" },
  { value: "+92", label: "🇵🇰 Pakistan (+92)", country: "Pakistan" },
  { value: "+680", label: "🇵🇼 Palau (+680)", country: "Palau" },
  { value: "+970", label: "🇵🇸 Palestine (+970)", country: "Palestine" },
  { value: "+507", label: "🇵🇦 Panama (+507)", country: "Panama" },
  { value: "+675", label: "🇵🇬 Papua New Guinea (+675)", country: "Papua New Guinea" },
  { value: "+595", label: "🇵🇾 Paraguay (+595)", country: "Paraguay" },
  { value: "+51", label: "🇵🇪 Peru (+51)", country: "Peru" },
  { value: "+63", label: "🇵🇭 Philippines (+63)", country: "Philippines" },
  { value: "+64", label: "🇵🇳 Pitcairn (+64)", country: "Pitcairn" },
  { value: "+48", label: "🇵🇱 Poland (+48)", country: "Poland" },
  { value: "+351", label: "🇵🇹 Portugal (+351)", country: "Portugal" },
  { value: "+1787", label: "🇵🇷 Puerto Rico (+1787)", country: "Puerto Rico" },
  { value: "+974", label: "🇶🇦 Qatar (+974)", country: "Qatar" },
  { value: "+262", label: "🇷🇪 Réunion (+262)", country: "Réunion" },
  { value: "+40", label: "🇷🇴 Romania (+40)", country: "Romania" },
  { value: "+7", label: "🇷🇺 Russia (+7)", country: "Russia" },
  { value: "+250", label: "🇷🇼 Rwanda (+250)", country: "Rwanda" },
  { value: "+290", label: "🇸🇭 Saint Helena (+290)", country: "Saint Helena" },
  { value: "+1869", label: "🇰🇳 Saint Kitts and Nevis (+1869)", country: "Saint Kitts and Nevis" },
  { value: "+1758", label: "🇱🇨 Saint Lucia (+1758)", country: "Saint Lucia" },
  { value: "+508", label: "🇵🇲 Saint Pierre and Miquelon (+508)", country: "Saint Pierre and Miquelon" },
  { value: "+1784", label: "🇻🇨 Saint Vincent and the Grenadines (+1784)", country: "Saint Vincent and the Grenadines" },
  { value: "+685", label: "🇼🇸 Samoa (+685)", country: "Samoa" },
  { value: "+378", label: "🇸🇲 San Marino (+378)", country: "San Marino" },
  { value: "+239", label: "🇸🇹 São Tomé and Príncipe (+239)", country: "São Tomé and Príncipe" },
  { value: "+221", label: "🇸🇳 Senegal (+221)", country: "Senegal" },
  { value: "+381", label: "🇷🇸 Serbia (+381)", country: "Serbia" },
  { value: "+248", label: "🇸🇨 Seychelles (+248)", country: "Seychelles" },
  { value: "+232", label: "🇸🇱 Sierra Leone (+232)", country: "Sierra Leone" },
  { value: "+65", label: "🇸🇬 Singapore (+65)", country: "Singapore" },
  { value: "+421", label: "🇸🇰 Slovakia (+421)", country: "Slovakia" },
  { value: "+386", label: "🇸🇮 Slovenia (+386)", country: "Slovenia" },
  { value: "+677", label: "🇸🇧 Solomon Islands (+677)", country: "Solomon Islands" },
  { value: "+252", label: "🇸🇴 Somalia (+252)", country: "Somalia" },
  { value: "+27", label: "🇿🇦 South Africa (+27)", country: "South Africa" },
  { value: "+500", label: "🇬🇸 South Georgia and the South Sandwich Islands (+500)", country: "South Georgia and the South Sandwich Islands" },
  { value: "+34", label: "🇪🇸 Spain (+34)", country: "Spain" },
  { value: "+94", label: "🇱🇰 Sri Lanka (+94)", country: "Sri Lanka" },
  { value: "+249", label: "🇸🇩 Sudan (+249)", country: "Sudan" },
  { value: "+597", label: "🇸🇷 Suriname (+597)", country: "Suriname" },
  { value: "+47", label: "🇸🇯 Svalbard and Jan Mayen (+47)", country: "Svalbard and Jan Mayen" },
  { value: "+268", label: "🇸🇿 Eswatini (+268)", country: "Eswatini" },
  { value: "+46", label: "🇸🇪 Sweden (+46)", country: "Sweden" },
  { value: "+41", label: "🇨🇭 Switzerland (+41)", country: "Switzerland" },
  { value: "+963", label: "🇸🇾 Syria (+963)", country: "Syria" },
  { value: "+886", label: "🇹🇼 Taiwan (+886)", country: "Taiwan" },
  { value: "+992", label: "🇹🇯 Tajikistan (+992)", country: "Tajikistan" },
  { value: "+255", label: "🇹🇿 Tanzania (+255)", country: "Tanzania" },
  { value: "+66", label: "🇹🇭 Thailand (+66)", country: "Thailand" },
  { value: "+670", label: "🇹🇱 Timor-Leste (+670)", country: "Timor-Leste" },
  { value: "+228", label: "🇹🇬 Togo (+228)", country: "Togo" },
  { value: "+690", label: "🇹🇰 Tokelau (+690)", country: "Tokelau" },
  { value: "+676", label: "🇹🇴 Tonga (+676)", country: "Tonga" },
  { value: "+1868", label: "🇹🇹 Trinidad and Tobago (+1868)", country: "Trinidad and Tobago" },
  { value: "+216", label: "🇹🇳 Tunisia (+216)", country: "Tunisia" },
  { value: "+90", label: "🇹🇷 Turkey (+90)", country: "Turkey" },
  { value: "+993", label: "🇹🇲 Turkmenistan (+993)", country: "Turkmenistan" },
  { value: "+1649", label: "🇹🇨 Turks and Caicos Islands (+1649)", country: "Turks and Caicos Islands" },
  { value: "+688", label: "🇹🇻 Tuvalu (+688)", country: "Tuvalu" },
  { value: "+256", label: "🇺🇬 Uganda (+256)", country: "Uganda" },
  { value: "+380", label: "🇺🇦 Ukraine (+380)", country: "Ukraine" },
  { value: "+44", label: "🇬🇧 United Kingdom (+44)", country: "United Kingdom" },
  { value: "+1", label: "🇺🇸 United States (+1)", country: "United States" },
  { value: "+598", label: "🇺🇾 Uruguay (+598)", country: "Uruguay" },
  { value: "+998", label: "🇺🇿 Uzbekistan (+998)", country: "Uzbekistan" },
  { value: "+678", label: "🇻🇺 Vanuatu (+678)", country: "Vanuatu" },
  { value: "+58", label: "🇻🇪 Venezuela (+58)", country: "Venezuela" },
  { value: "+84", label: "🇻🇳 Vietnam (+84)", country: "Vietnam" },
  { value: "+1284", label: "🇻🇬 British Virgin Islands (+1284)", country: "British Virgin Islands" },
  { value: "+1340", label: "🇻🇮 U.S. Virgin Islands (+1340)", country: "U.S. Virgin Islands" },
  { value: "+681", label: "🇼🇫 Wallis and Futuna (+681)", country: "Wallis and Futuna" },
  { value: "+967", label: "🇾🇪 Yemen (+967)", country: "Yemen" },
  { value: "+260", label: "🇿🇲 Zambia (+260)", country: "Zambia" },
  { value: "+263", label: "🇿🇼 Zimbabwe (+263)", country: "Zimbabwe" },
];

interface CountryCodeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function CountryCodeSelect({ value, onValueChange, className }: CountryCodeSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedCountry = countries.find((country) => country.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {selectedCountry ? selectedCountry.label.split(' ')[0] + ' ' + selectedCountry.value : "Select..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={`${country.country} ${country.value}`}
                  onSelect={() => {
                    onValueChange(country.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {country.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
