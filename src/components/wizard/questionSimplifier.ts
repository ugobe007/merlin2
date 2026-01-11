/**
 * Question Simplifier
 * 
 * Simplifies technical questions and adds helpful prompts/context
 * Moves technical details from question text to help_text
 */

interface QuestionSimplification {
  simplifiedText: string;
  helpText?: string;
  prompt?: string;
}

/**
 * Simplify question text by removing technical jargon and adding helpful context
 */
export function simplifyQuestion(
  originalText: string,
  fieldName: string,
  questionType?: string
): QuestionSimplification {
  const lowerText = originalText.toLowerCase();
  const lowerField = fieldName.toLowerCase();

  // ============================================================================
  // EV CHARGING QUESTIONS
  // ============================================================================
  
  if (lowerField.includes('mcs') || lowerField.includes('megawatt')) {
    return {
      simplifiedText: 'Number of MCS Chargers?',
      helpText: 'MCS (Megawatt Charging System) chargers are high-power chargers for heavy-duty vehicles. Each charger is rated at 1,250 kW (1.25 MW).',
      prompt: 'How many MCS chargers do you have or plan to install?'
    };
  }

  if (lowerField.includes('dcfc') || lowerField.includes('dc_fast') || (lowerText.includes('dc fast') && lowerText.includes('350'))) {
    return {
      simplifiedText: 'Number of DC Fast Chargers?',
      helpText: 'DC Fast Chargers provide rapid charging for electric vehicles. Each charger is rated at 350 kW.',
      prompt: 'How many DC Fast Chargers (350 kW) do you have or plan to install?'
    };
  }

  if (lowerField.includes('level2') || lowerField.includes('level_2') || lowerField.includes('l2') || (lowerText.includes('level 2') && lowerText.includes('19'))) {
    return {
      simplifiedText: 'Number of Level 2 Chargers?',
      helpText: 'Level 2 Chargers are standard AC charging stations for electric vehicles. Each charger is rated at 19.2 kW.',
      prompt: 'How many Level 2 Chargers (19.2 kW) do you have or plan to install?'
    };
  }

  // ============================================================================
  // FACILITY QUESTIONS
  // ============================================================================

  if (lowerField.includes('bay') && (lowerText.includes('wash') || lowerText.includes('service'))) {
    return {
      simplifiedText: 'Number of Wash Bays?',
      helpText: 'Include all vehicle wash bays or service bays (e.g., Speedco, truck wash).',
      prompt: 'How many wash or service bays does your facility have?'
    };
  }

  if (lowerField.includes('parking') || lowerField.includes('lot')) {
    return {
      simplifiedText: 'Parking Lot Size?',
      helpText: 'Enter the size of your parking lot in acres. LED pole lighting typically requires 2 kW per pole (about 50 poles for large lots, or 10 kW per acre).',
      prompt: 'How many acres is your parking lot?'
    };
  }

  if (lowerField.includes('square') || lowerField.includes('sqft') || lowerField.includes('sq_ft')) {
    return {
      simplifiedText: 'Total Facility Size?',
      helpText: 'Enter the total square footage of your facility (building area including retail, QSR, maintenance, etc.).',
      prompt: 'What is the total square footage of your facility?'
    };
  }

  // ============================================================================
  // OPERATIONS QUESTIONS
  // ============================================================================

  if (lowerField.includes('operating') && (lowerField.includes('hour') || lowerField.includes('time'))) {
    return {
      simplifiedText: 'Operating Hours?',
      helpText: 'How many hours per day does your facility operate?',
      prompt: 'How many hours per day is your facility open?'
    };
  }

  if (lowerField.includes('vehicle') || lowerField.includes('car') || lowerField.includes('truck')) {
    return {
      simplifiedText: 'Daily Vehicle Count?',
      helpText: 'How many vehicles does your facility serve per day on average?',
      prompt: 'Approximately how many vehicles visit your facility per day?'
    };
  }

  // ============================================================================
  // AMENITIES/FACILITIES QUESTIONS
  // ============================================================================

  if (lowerField.includes('shower') || lowerText.includes('shower')) {
    return {
      simplifiedText: 'Shower Facilities?',
      helpText: 'Shower facilities add approximately 60 kW constant load to your energy usage.',
      prompt: 'Does your facility have shower facilities for drivers?'
    };
  }

  if (lowerField.includes('laundry') || lowerText.includes('laundry')) {
    return {
      simplifiedText: 'Laundry Facilities?',
      helpText: 'Laundry facilities add approximately 70 kW constant load to your energy usage.',
      prompt: 'Does your facility have laundry facilities?'
    };
  }

  if (lowerField.includes('restaurant') || lowerField.includes('qsr') || lowerField.includes('food')) {
    return {
      simplifiedText: 'Restaurant or Food Service?',
      helpText: 'Includes quick-service restaurants (QSR), cafeterias, or any food service areas.',
      prompt: 'Does your facility have a restaurant or food service area?'
    };
  }

  // ============================================================================
  // ENERGY/CLIMATE QUESTIONS
  // ============================================================================

  if (lowerField.includes('climate') || lowerField.includes('zone')) {
    return {
      simplifiedText: 'Climate Zone?',
      helpText: 'CRITICAL for thermal management. Hot zones (desert locations like AZ, NV, TX, FL) require additional cooling for battery systems and transformers, adding approximately 30 kW parasitic load.',
      prompt: 'What is your facility\'s primary climate zone?'
    };
  }

  // ============================================================================
  // GENERAL SIMPLIFICATIONS
  // ============================================================================

  // Remove kW values from question text
  if (lowerText.includes('kw') || lowerText.includes('kilowatt')) {
    const kwMatch = lowerText.match(/(\d+,?\d*)\s*kw/i);
    if (kwMatch) {
      // Remove kW reference from main question
      const cleaned = originalText.replace(/\s*\([^)]*kw[^)]*\)/gi, '').replace(/\s*\([^)]*\d+,?\d*\s*kw[^)]*\)/gi, '');
      return {
        simplifiedText: cleaned.trim(),
        helpText: `Each unit is rated at ${kwMatch[1]} kW.`,
        prompt: originalText
      };
    }
  }

  // Remove technical specifications from parentheses
  if (originalText.includes('(') && originalText.includes(')')) {
    const hasTechnicalSpec = /\([^)]*(kw|mw|kwh|voltage|rated|capacity)[^)]*\)/i.test(originalText);
    if (hasTechnicalSpec) {
      const cleaned = originalText.replace(/\s*\([^)]+\)/g, '').trim();
      return {
        simplifiedText: cleaned,
        helpText: 'See technical specifications in help text if needed.',
        prompt: originalText
      };
    }
  }

  // Default: return original with slight cleanup
  return {
    simplifiedText: originalText.trim(),
    helpText: undefined,
    prompt: undefined
  };
}

/**
 * Format question with helpful prompt
 */
export function formatQuestionWithPrompt(
  question: string,
  helpText?: string,
  prompt?: string
): string {
  if (prompt) {
    return prompt;
  }
  return question;
}
