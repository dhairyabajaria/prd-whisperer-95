import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

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
      return [];
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
      return [];
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
      return [];
    }
  }

  async processChatQuery(
    query: string,
    businessContext: any
  ): Promise<{ response: string; actionable: boolean; suggestedActions?: string[] }> {
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
      return {
        response: "I'm experiencing technical difficulties. Please try again later.",
        actionable: false
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
}

export const aiService = new AIService();
