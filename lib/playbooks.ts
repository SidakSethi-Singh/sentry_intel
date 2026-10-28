/**
 * Sentry Intel - Response Playbooks ("What to do")
 * Generates structured, role-separated action guidance and verified official links
 * for defense analysts and civilian safety (when applicable).
 *
 * Safety Rules:
 * - Never invent phone numbers, addresses, or shelter locations.
 * - Link only to well-known official bodies (CERT-In, NDMA, IMD, Indian Navy, etc.).
 * - UI carries the mandatory disclaimer: "Guidance only - always follow your local authorities' instructions."
 */

export interface RecommendedAction {
  action: string;
  audience: "analyst" | "civilian";
  priority: "immediate" | "high" | "routine";
}

export interface OfficialLink {
  name: string;
  url: string;
}

export interface PlaybookResult {
  category: "cyber" | "natural_disaster" | "border_security" | "maritime" | "defence_tech" | "space" | "general";
  recommended_actions: RecommendedAction[];
  official_links: OfficialLink[];
  disclaimer: string;
}

export const PLAYBOOK_DISCLAIMER = "Guidance only — always follow your local authorities' instructions.";

/**
 * Detects the intelligence category of an alert based on text, title, and entities.
 */
export function detectCategory(text: string, title: string = ""): PlaybookResult["category"] {
  const combined = `${title} ${text}`.toLowerCase();

  if (
    combined.includes("cyber") ||
    combined.includes("malware") ||
    combined.includes("trojan") ||
    combined.includes("cert-in") ||
    combined.includes("ddos") ||
    combined.includes("zero-day")
  ) {
    return "cyber";
  }

  if (
    combined.includes("cyclone") ||
    combined.includes("flood") ||
    combined.includes("glof") ||
    combined.includes("storm surge") ||
    combined.includes("disaster") ||
    combined.includes("ndrf") ||
    combined.includes("imd")
  ) {
    return "natural_disaster";
  }

  if (
    combined.includes("piracy") ||
    combined.includes("skiffs") ||
    combined.includes("gulf of aden") ||
    combined.includes("navy") ||
    combined.includes("merchant ship") ||
    combined.includes("bulk carrier") ||
    combined.includes("arabian sea") ||
    combined.includes("coast guard")
  ) {
    return "maritime";
  }

  if (
    combined.includes("airspace") ||
    combined.includes("drone") ||
    combined.includes("uav") ||
    combined.includes("sukhoi") ||
    combined.includes("iaf") ||
    combined.includes("border") ||
    combined.includes("bsf") ||
    combined.includes("lac") ||
    combined.includes("tunnel") ||
    combined.includes("ladakh") ||
    combined.includes("chinar corps")
  ) {
    return "border_security";
  }

  if (
    combined.includes("glide bomb") ||
    combined.includes("aip") ||
    combined.includes("drdo") ||
    combined.includes("mq-9b") ||
    combined.includes("loitering munition")
  ) {
    return "defence_tech";
  }

  if (
    combined.includes("space") ||
    combined.includes("satellite") ||
    combined.includes("isro") ||
    combined.includes("antariksha")
  ) {
    return "space";
  }

  return "general";
}

/**
 * Generates audience-separated recommended actions and verified links for any alert.
 */
export function getRecommendedActions(alert: {
  summary: string;
  title?: string;
  text?: string;
  severity?: string;
  score?: number;
}): PlaybookResult {
  const text = `${alert.title || ""} ${alert.summary || ""} ${alert.text || ""}`;
  const category = detectCategory(text, alert.title);
  const isCritical = alert.severity === "critical" || (alert.score || 0) >= 80;

  const actions: RecommendedAction[] = [];
  const links: OfficialLink[] = [];

  switch (category) {
    case "cyber":
      actions.push(
        {
          action: "Isolate external-facing internet gateways and verify zero-day patch status on SCADA/VPN networks.",
          audience: "analyst",
          priority: isCritical ? "immediate" : "high",
        },
        {
          action: "Cross-correlate IP/domain telemetry against national threat intelligence feeds and CERT-In advisories.",
          audience: "analyst",
          priority: "high",
        },
        {
          action: "Brief CISO and technical leadership on potential supply-chain and perimeter exposure.",
          audience: "analyst",
          priority: "routine",
        },
        {
          action: "Civilian administrators: Enable multi-factor authentication (MFA) on all access portals and report phishing or fraud via official portals.",
          audience: "civilian",
          priority: "high",
        }
      );
      links.push(
        { name: "CERT-In National Vulnerability Advisories", url: "https://www.cert-in.org.in" },
        { name: "NCIIPC Critical Infrastructure Portal", url: "https://nciipc.gov.in" },
        { name: "National Cyber Crime Reporting Portal", url: "https://cybercrime.gov.in" }
      );
      break;

    case "natural_disaster":
      actions.push(
        {
          action: "Monitor real-time IMD radar tracks and coordinate emergency logistics channels with state disaster management authorities.",
          audience: "analyst",
          priority: isCritical ? "immediate" : "high",
        },
        {
          action: "Verify communications link survivability in vulnerable coastal/riverine district outposts.",
          audience: "analyst",
          priority: "high",
        },
        {
          action: "Disseminate localized storm surge / evacuation bulletins to district response nodes.",
          audience: "analyst",
          priority: "routine",
        },
        {
          action: "Move immediately to designated cyclone shelter hubs or reinforced concrete buildings as directed by district authorities.",
          audience: "civilian",
          priority: "immediate",
        },
        {
          action: "Stay away from low-lying coastlines, broken power transmission lines, and waterlogged roads.",
          audience: "civilian",
          priority: "high",
        },
        {
          action: "Keep battery-operated emergency radios, drinking water, and essential medications at hand.",
          audience: "civilian",
          priority: "high",
        }
      );
      links.push(
        { name: "National Disaster Management Authority (NDMA)", url: "https://ndma.gov.in" },
        { name: "India Meteorological Department (IMD Cyclone Bulletins)", url: "https://mausam.imd.gov.in" },
        { name: "ReliefWeb Global Crisis Updates", url: "https://reliefweb.int" }
      );
      break;

    case "border_security":
      actions.push(
        {
          action: "Escalate to sector intelligence desk; initiate secondary radar cross-checks and forward UAV surveillance tracking.",
          audience: "analyst",
          priority: isCritical ? "immediate" : "high",
        },
        {
          action: "Verify electronic warfare jamming countermeasures status with frontline ground batteries.",
          audience: "analyst",
          priority: "immediate",
        },
        {
          action: "Brief local tactical command on adversary flight path, telemetry forensics, and wreckage cordon progress.",
          audience: "analyst",
          priority: "high",
        },
        {
          action: "Corroborate wire reports with official Ministry of Defence / PIB Defence releases before external dissemination.",
          audience: "analyst",
          priority: "routine",
        }
      );
      links.push(
        { name: "Press Information Bureau (Defence Releases)", url: "https://pib.gov.in" },
        { name: "Ministry of Defence Official Portal", url: "https://mod.gov.in" },
        { name: "Indian Air Force Official Portal", url: "https://indianairforce.nic.in" }
      );
      break;

    case "maritime":
      actions.push(
        {
          action: "Broadcast VHF Ch-16 security advisory to all merchant vessels operating along transit corridor.",
          audience: "analyst",
          priority: isCritical ? "immediate" : "high",
        },
        {
          action: "Coordinate tactical escort deployment with nearest naval destroyer task group and maritime patrol aircraft.",
          audience: "analyst",
          priority: "immediate",
        },
        {
          action: "Liaise with UKMTO and regional Maritime Rescue Coordination Centres (MRCC) for situational awareness updates.",
          audience: "analyst",
          priority: "high",
        },
        {
          action: "Log incident telemetry into international anti-piracy databases and conduct post-mission commando debrief.",
          audience: "analyst",
          priority: "routine",
        }
      );
      links.push(
        { name: "Indian Navy Headquarters Bureau", url: "https://indiannavy.nic.in" },
        { name: "UK Maritime Trade Operations (UKMTO)", url: "https://www.ukmto.org" },
        { name: "Indian Coast Guard Rescue Coordination", url: "https://indiancoastguard.gov.in" }
      );
      break;

    case "defence_tech":
    case "space":
      actions.push(
        {
          action: "Ingest trial telemetry data and archive sub-meter precision metrics into stand-off capabilities catalog.",
          audience: "analyst",
          priority: "high",
        },
        {
          action: "Assess adversary counter-measure capabilities against indigenous guidance/propulsion profiles.",
          audience: "analyst",
          priority: "routine",
        },
        {
          action: "Brief joint command headquarters on serial production timelines and frontline unit induction schedule.",
          audience: "analyst",
          priority: "routine",
        }
      );
      links.push(
        { name: "Defence Research and Development Organisation (DRDO)", url: "https://drdo.gov.in" },
        { name: "Indian Space Research Organisation (ISRO)", url: "https://isro.gov.in" },
        { name: "Ministry of Defence Acquisition Wing", url: "https://mod.gov.in" }
      );
      break;

    default:
      actions.push(
        {
          action: "Cross-reference report against secondary independent media and official press releases.",
          audience: "analyst",
          priority: "high",
        },
        {
          action: "Monitor target sector for follow-up incident signals and operational escalation.",
          audience: "analyst",
          priority: "routine",
        },
        {
          action: "Update tactical intelligence tracker and notify desk supervisor.",
          audience: "analyst",
          priority: "routine",
        }
      );
      links.push(
        { name: "Press Information Bureau (Government of India)", url: "https://pib.gov.in" },
        { name: "Ministry of Defence", url: "https://mod.gov.in" }
      );
      break;
  }

  return {
    category,
    recommended_actions: actions,
    official_links: links,
    disclaimer: PLAYBOOK_DISCLAIMER,
  };
}
