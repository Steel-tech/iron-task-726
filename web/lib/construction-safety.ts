/**
 * Construction Safety Analysis
 */

export interface SafetyCheck {
  activity: string
  hazardLevel: string
  recommendations: string[]
}

export class ConstructionSafety {
  checkActivity(activityType: string): SafetyCheck {
    const recommendations: string[] = []
    let hazardLevel = 'low'

    if (activityType === 'ERECTION') {
      hazardLevel = 'high'
      recommendations.push('Use fall protection equipment')
      recommendations.push('Maintain three points of contact')
    }

    if (activityType === 'WELDING') {
      hazardLevel = 'medium'
      recommendations.push('Ensure proper ventilation')
      recommendations.push('Maintain fire watch')
    }

    recommendations.push('Wear required PPE')
    recommendations.push('Follow safety protocols')

    return {
      activity: activityType,
      hazardLevel,
      recommendations
    }
  }

  getGeneralGuidelines(): string[] {
    return [
      'Conduct daily safety meetings',
      'Wear hard hats and safety glasses',
      'Report unsafe conditions',
      'Keep work areas clean'
    ]
  }
}