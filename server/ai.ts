import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user

// Helper function to check if OpenAI is properly configured
export function isOpenAIConfigured(): boolean {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;
  return !!(apiKey && apiKey !== "default_key" && apiKey.trim().length > 0);
}

// Only initialize OpenAI if we have a valid API key
let openai: OpenAI | null = null;
if (isOpenAIConfigured()) {
  openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR
  });
}

export interface InventoryRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  recommendedReorder: number;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  suggestedSupplier?: string;
}

export interface PriceOptimization {
  productId: string;
  productName: string;
  currentPrice: number;
  suggestedPrice: number;
  potentialMarginIncrease: number;
  competitorData: string;
}

export interface AIInsight {
  type: 'reorder' | 'price_optimization' | 'expiry_alert' | 'sales_trend';
  title: string;
  description: string;
  actionText: string;
  urgency: 'low' | 'medium' | 'high';
  data?: any;
}

export class AIService {
  // Fallback data generators for when AI is unavailable
  private generateFallbackInventoryRecommendations(inventoryData: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    salesHistory: number[];
    leadTimeDays: number;
    minStockLevel: number;
  }>): InventoryRecommendation[] {
    return inventoryData
      .filter(item => item.currentStock <= item.minStockLevel * 1.5)
      .slice(0, 3)
      .map(item => ({
        productId: item.productId,
        productName: item.productName,
        currentStock: item.currentStock,
        recommendedReorder: Math.max(item.minStockLevel * 2, 100),
        reason: item.currentStock <= item.minStockLevel 
          ? "Stock below minimum level - reorder required"
          : "Stock approaching minimum level - consider reordering",
        urgency: item.currentStock <= item.minStockLevel ? 'high' : 'medium',
        suggestedSupplier: "Auto-suggested supplier"
      }));
  }

  private generateFallbackBusinessInsights(): AIInsight[] {
    return [
      {
        type: 'reorder',
        title: 'Stock Level Review Needed',
        description: 'Several products are approaching minimum stock levels. Regular inventory review recommended.',
        actionText: 'Review inventory levels',
        urgency: 'medium'
      },
      {
        type: 'sales_trend',
        title: 'Monitor Sales Performance',
        description: 'Track your sales metrics regularly to identify trends and opportunities.',
        actionText: 'View sales reports',
        urgency: 'low'
      }
    ];
  }

  private generateFallbackPriceOptimizations(productData: Array<{
    productId: string;
    productName: string;
    currentPrice: number;
    salesVolume: number;
    competitorPrices: number[];
    marginPercentage: number;
  }>): PriceOptimization[] {
    return productData.slice(0, 2).map(product => {
      const avgCompetitorPrice = product.competitorPrices.length > 0 
        ? product.competitorPrices.reduce((a, b) => a + b, 0) / product.competitorPrices.length
        : product.currentPrice;
      
      return {
        productId: product.productId,
        productName: product.productName,
        currentPrice: product.currentPrice,
        suggestedPrice: avgCompetitorPrice,
        potentialMarginIncrease: Math.abs(avgCompetitorPrice - product.currentPrice) * 0.1,
        competitorData: `Competitor prices range from ${Math.min(...product.competitorPrices)} to ${Math.max(...product.competitorPrices)}`
      };
    });
  }

  async generateInventoryRecommendations(
    inventoryData: Array<{
      productId: string;
      productName: string;
      currentStock: number;
      salesHistory: number[];
      leadTimeDays: number;
      minStockLevel: number;
    }>
  ): Promise<InventoryRecommendation[]> {
    // Return fallback data if OpenAI is not configured
    if (!isOpenAIConfigured() || !openai) {
      console.log('OpenAI not configured, returning fallback inventory recommendations');
      return this.generateFallbackInventoryRecommendations(inventoryData);
    }

    try {
      const prompt = `
        As a pharmaceutical inventory management AI, analyze the following inventory data and provide reorder recommendations.
        
        Inventory Data:
        ${JSON.stringify(inventoryData, null, 2)}
        
        Consider:
        1. Sales trends and velocity
        2. Lead times
        3. Minimum stock levels
        4. Pharmaceutical shelf life
        5. Seasonal patterns
        
        Provide recommendations in JSON format with these fields:
        - productId: string
        - productName: string
        - currentStock: number
        - recommendedReorder: number
        - reason: string explaining the recommendation
        - urgency: "low" | "medium" | "high"
        - suggestedSupplier: string (if applicable)
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an AI specialist in pharmaceutical inventory management. Provide accurate, actionable recommendations in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
      return result.recommendations || [];
    } catch (error) {
      console.error('Error generating inventory recommendations:', error);
      // Return fallback data on error
      return this.generateFallbackInventoryRecommendations(inventoryData);
    }
  }

  async analyzePriceOptimization(
    productData: Array<{
      productId: string;
      productName: string;
      currentPrice: number;
      salesVolume: number;
      competitorPrices: number[];
      marginPercentage: number;
    }>
  ): Promise<PriceOptimization[]> {
    // Return fallback data if OpenAI is not configured
    if (!isOpenAIConfigured() || !openai) {
      console.log('OpenAI not configured, returning fallback price optimizations');
      return this.generateFallbackPriceOptimizations(productData);
    }

    try {
      const prompt = `
        Analyze pharmaceutical product pricing for optimization opportunities.
        
        Product Data:
        ${JSON.stringify(productData, null, 2)}
        
        Consider:
        1. Competitor pricing
        2. Sales volume sensitivity
        3. Margin optimization
        4. Market positioning
        5. Pharmaceutical regulations
        
        Provide pricing recommendations in JSON format with fields:
        - productId: string
        - productName: string
        - currentPrice: number
        - suggestedPrice: number
        - potentialMarginIncrease: number
        - competitorData: string summary
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a pharmaceutical pricing optimization specialist. Provide conservative, market-appropriate pricing recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"optimizations": []}');
      return result.optimizations || [];
    } catch (error) {
      console.error('Error analyzing price optimization:', error);
      // Return fallback data on error
      return this.generateFallbackPriceOptimizations(productData);
    }
  }

  async generateBusinessInsights(
    businessData: {
      salesMetrics: any;
      inventoryMetrics: any;
      customerMetrics: any;
      financialMetrics: any;
    }
  ): Promise<AIInsight[]> {
    // Return fallback data if OpenAI is not configured
    if (!isOpenAIConfigured() || !openai) {
      console.log('OpenAI not configured, returning fallback business insights');
      return this.generateFallbackBusinessInsights();
    }

    try {
      const prompt = `
        Analyze pharmaceutical distribution business data and provide actionable insights.
        
        Business Data:
        ${JSON.stringify(businessData, null, 2)}
        
        Generate insights for:
        1. Inventory optimization opportunities
        2. Sales trend analysis
        3. Customer behavior patterns
        4. Financial performance improvements
        5. Operational efficiency gains
        
        Return insights in JSON format with fields:
        - type: "reorder" | "price_optimization" | "expiry_alert" | "sales_trend"
        - title: string
        - description: string
        - actionText: string
        - urgency: "low" | "medium" | "high"
        - data: relevant data object
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a pharmaceutical business intelligence AI. Provide specific, actionable insights based on data analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"insights": []}');
      return result.insights || [];
    } catch (error) {
      console.error('Error generating business insights:', error);
      // Return fallback data on error
      return this.generateFallbackBusinessInsights();
    }
  }

  async processChatQuery(
    query: string,
    businessContext: any
  ): Promise<{ response: string; actionable: boolean; suggestedActions?: string[] }> {
    // Return fallback response if OpenAI is not configured
    if (!isOpenAIConfigured() || !openai) {
      console.log('OpenAI not configured, returning fallback chat response');
      return {
        response: "AI chat is currently unavailable. Please contact your administrator to configure AI services, or try using the standard dashboard features.",
        actionable: true,
        suggestedActions: [
          "Check dashboard metrics",
          "Review inventory levels", 
          "View recent orders",
          "Contact system administrator"
        ]
      };
    }

    try {
      const prompt = `
        You are an AI assistant for a pharmaceutical ERP system. Answer the user's query based on the business context provided.
        
        User Query: "${query}"
        
        Business Context:
        ${JSON.stringify(businessContext, null, 2)}
        
        Provide a helpful response that:
        1. Directly answers the question
        2. References specific data when possible
        3. Suggests actionable next steps
        4. Uses pharmaceutical industry knowledge
        
        Return response in JSON format with fields:
        - response: string (the main answer)
        - actionable: boolean (whether specific actions can be taken)
        - suggestedActions: string[] (if actionable, list of suggested actions)
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a knowledgeable pharmaceutical ERP assistant. Provide accurate, helpful responses with specific recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"response": "I\'m sorry, I couldn\'t process your query.", "actionable": false}');
      return {
        response: result.response || "I'm sorry, I couldn't process your query.",
        actionable: result.actionable || false,
        suggestedActions: result.suggestedActions || []
      };
    } catch (error) {
      console.error('Error processing chat query:', error);
      // Return fallback response on error
      return {
        response: "I'm experiencing technical difficulties. Please try using the dashboard features or contact support.",
        actionable: true,
        suggestedActions: [
          "Check dashboard metrics",
          "Review inventory levels", 
          "Contact system administrator"
        ]
      };
    }
  }

  async analyzeCustomerSentiment(
    customerInteractions: Array<{
      customerId: string;
      customerName: string;
      interactions: string[];
      paymentHistory: string;
    }>
  ): Promise<Array<{
    customerId: string;
    customerName: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    summary: string;
    recommendations: string[];
  }>> {
    try {
      const prompt = `
        Analyze customer sentiment for pharmaceutical distribution customers based on their interactions and payment history.
        
        Customer Data:
        ${JSON.stringify(customerInteractions, null, 2)}
        
        Analyze:
        1. Communication tone and content
        2. Payment behavior patterns
        3. Order frequency and size
        4. Complaint history
        5. Overall relationship health
        
        Return analysis in JSON format with fields:
        - customerId: string
        - customerName: string
        - sentiment: "positive" | "neutral" | "negative"
        - score: number (0-100)
        - summary: string description
        - recommendations: string[] of actionable items
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a customer relationship specialist for pharmaceutical distribution. Analyze customer sentiment and provide relationship management recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"analyses": []}');
      return result.analyses || [];
    } catch (error) {
      console.error('Error analyzing customer sentiment:', error);
      return [];
    }
  }

  // Enhanced Purchase Module AI Capabilities

  async processVendorBillOCR(
    ocrRawText: string,
    billImageBase64?: string
  ): Promise<{
    success: boolean;
    extractedData?: {
      billNumber?: string;
      supplierName?: string;
      billDate?: string;
      dueDate?: string;
      totalAmount?: number;
      currency?: string;
      items?: Array<{
        description: string;
        quantity?: number;
        unitPrice?: number;
        lineTotal?: number;
      }>;
      taxAmount?: number;
      paymentTerms?: string;
    };
    confidence?: number;
    error?: string;
  }> {
    try {
      let prompt = `
        Extract structured data from this vendor bill/invoice text for pharmaceutical ERP system.
        
        OCR Text:
        ${ocrRawText}
        
        Extract the following information with high accuracy:
        1. Bill/Invoice number
        2. Supplier/Vendor name
        3. Bill date and due date
        4. Total amount and currency
        5. Line items (description, quantity, unit price, line total)
        6. Tax amounts
        7. Payment terms
        
        Return data in JSON format with fields:
        - billNumber: string
        - supplierName: string
        - billDate: string (YYYY-MM-DD format)
        - dueDate: string (YYYY-MM-DD format)
        - totalAmount: number
        - currency: string (ISO code)
        - items: array of {description, quantity, unitPrice, lineTotal}
        - taxAmount: number
        - paymentTerms: string
        - confidence: number (0-100)
        
        If any field cannot be determined, leave it null.
      `;

      const messages: any[] = [
        {
          role: "system",
          content: "You are an expert OCR processor for pharmaceutical vendor bills and invoices. Extract data with high accuracy and indicate confidence levels."
        },
        {
          role: "user",
          content: prompt
        }
      ];

      // If image is provided, include it in the prompt
      if (billImageBase64) {
        messages[1].content = [
          {
            type: "text",
            text: prompt
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${billImageBase64}`
            }
          }
        ];
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.3, // Low temperature for accuracy
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        success: true,
        extractedData: result,
        confidence: result.confidence || 70
      };
    } catch (error) {
      console.error('Error processing vendor bill OCR:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OCR processing failed'
      };
    }
  }

  async analyzeCompetitorPriceTrends(
    competitorPriceData: Array<{
      productId: string;
      productName: string;
      ourCurrentPrice: number;
      ourCurrency: string;
      competitorPrices: Array<{
        competitor: string;
        price: number;
        currency: string;
        collectedAt: Date;
      }>;
      salesVolume: number;
      marginPercentage: number;
    }>
  ): Promise<Array<{
    productId: string;
    productName: string;
    pricePosition: 'competitive' | 'premium' | 'budget';
    recommendedAction: 'maintain' | 'increase' | 'decrease' | 'monitor';
    suggestedPriceRange: { min: number; max: number; optimal: number };
    marketAnalysis: string;
    urgency: 'low' | 'medium' | 'high';
    potentialImpact: {
      revenueChange: number;
      marginChange: number;
      competitiveAdvantage: string;
    };
  }>> {
    try {
      const prompt = `
        Analyze competitor pricing data for pharmaceutical products and provide strategic pricing recommendations.
        
        Pricing Data:
        ${JSON.stringify(competitorPriceData, null, 2)}
        
        Analyze:
        1. Current market position vs competitors
        2. Price elasticity and volume sensitivity
        3. Margin optimization opportunities
        4. Market trends and competitive dynamics
        5. Strategic positioning implications
        
        Provide analysis in JSON format with fields:
        - productId: string
        - productName: string
        - pricePosition: "competitive" | "premium" | "budget"
        - recommendedAction: "maintain" | "increase" | "decrease" | "monitor"
        - suggestedPriceRange: {min: number, max: number, optimal: number}
        - marketAnalysis: string summary
        - urgency: "low" | "medium" | "high"
        - potentialImpact: {revenueChange: number, marginChange: number, competitiveAdvantage: string}
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a pharmaceutical pricing strategist with deep market analysis expertise. Provide data-driven pricing recommendations that balance competitiveness with profitability."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"analyses": []}');
      return result.analyses || [];
    } catch (error) {
      console.error('Error analyzing competitor price trends:', error);
      return [];
    }
  }

  async generatePurchaseInsights(
    purchaseData: {
      totalPurchaseValue: number;
      openPurchaseOrders: number;
      pendingApprovals: number;
      topSuppliers: Array<{
        supplierName: string;
        totalValue: number;
        orderCount: number;
        averageLeadTime: number;
        reliabilityScore: number;
      }>;
      currencyExposure: Array<{
        currency: string;
        amount: number;
        exposureType: 'payables' | 'orders';
      }>;
      matchingExceptions: number;
      averageProcessingTime: number;
    }
  ): Promise<AIInsight[]> {
    try {
      const prompt = `
        Analyze purchasing data for a pharmaceutical distribution company and generate actionable insights.
        
        Purchase Data:
        ${JSON.stringify(purchaseData, null, 2)}
        
        Generate insights for:
        1. Supplier relationship optimization
        2. Currency risk management
        3. Process efficiency improvements
        4. Approval workflow optimization
        5. Cost reduction opportunities
        6. Risk mitigation strategies
        
        Return insights in JSON format with fields:
        - type: "supplier_optimization" | "currency_risk" | "process_efficiency" | "cost_reduction" | "risk_mitigation"
        - title: string
        - description: string
        - actionText: string
        - urgency: "low" | "medium" | "high"
        - data: relevant metrics and recommendations
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a pharmaceutical procurement specialist AI. Analyze purchasing data to identify optimization opportunities and provide strategic recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"insights": []}');
      return result.insights || [];
    } catch (error) {
      console.error('Error generating purchase insights:', error);
      return [];
    }
  }

  async analyzePurchaseRiskFactors(
    purchaseOrderData: Array<{
      orderId: string;
      supplierName: string;
      totalAmount: number;
      currency: string;
      deliveryDate: string;
      paymentTerms: string;
      supplierReliabilityScore: number;
      countryRisk: string;
      paymentHistory: string;
    }>
  ): Promise<Array<{
    orderId: string;
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    mitigation: string[];
    recommendedActions: string[];
    priorityScore: number;
  }>> {
    try {
      const prompt = `
        Analyze purchase order risk factors for pharmaceutical distribution operations.
        
        Purchase Order Data:
        ${JSON.stringify(purchaseOrderData, null, 2)}
        
        Evaluate risks including:
        1. Supplier reliability and payment history
        2. Currency and country risk exposure
        3. Delivery timeline risks
        4. Payment terms and cash flow impact
        5. Regulatory compliance risks
        6. Supply chain disruption potential
        
        Return risk analysis in JSON format with fields:
        - orderId: string
        - riskLevel: "low" | "medium" | "high"
        - riskFactors: string[] list of identified risks
        - mitigation: string[] suggested mitigation strategies
        - recommendedActions: string[] immediate actions to take
        - priorityScore: number (0-100)
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a pharmaceutical supply chain risk analyst. Identify and assess risks in purchase orders and provide practical mitigation strategies."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"analyses": []}');
      return result.analyses || [];
    } catch (error) {
      console.error('Error analyzing purchase risk factors:', error);
      return [];
    }
  }
}

export const aiService = new AIService();
