#!/usr/bin/env node
/**
 * Linear MCP Test Script
 * Test the Linear MCP server functionality
 */

const { LinearClient } = require('@linear/sdk');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local and .env files
function loadEnvFiles() {
  const envFiles = ['.env.local', '.env'];
  
  console.log('🔍 Debug: Checking for environment files...');
  
  envFiles.forEach(envFile => {
    const envPath = path.join(__dirname, envFile);
    console.log(`   Checking: ${envPath}`);
    
    if (fs.existsSync(envPath)) {
      console.log(`   ✅ Found: ${envFile}`);
      const envContent = fs.readFileSync(envPath, 'utf8');
      console.log(`   Content preview: ${envContent.substring(0, 100)}...`);
      
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
          console.log(`   Loaded: ${key.trim()} = ${value.substring(0, 20)}...`);
        }
      });
    } else {
      console.log(`   ❌ Not found: ${envFile}`);
    }
  });
}

// Load environment variables
loadEnvFiles();

async function testLinearConnection() {
  try {
    console.log('🔗 Testing Linear MCP Connection...\n');
    
    // Debug: Check if environment variables are loaded
    console.log('🔍 Debug: Environment variables loaded:');
    console.log(`   LINEAR_API_KEY: ${process.env.LINEAR_API_KEY ? 'Found' : 'Not found'}`);
    console.log(`   LINEAR_TOKEN: ${process.env.LINEAR_TOKEN ? 'Found' : 'Not found'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
    console.log('');
    
    // Initialize Linear client
    const linearToken = process.env.LINEAR_API_KEY || process.env.LINEAR_TOKEN;
    
    if (!linearToken) {
      throw new Error('LINEAR_API_KEY or LINEAR_TOKEN environment variable is required');
    }
    
    const client = new LinearClient({
      apiKey: linearToken,
    });
    
    console.log('✅ Linear client initialized successfully');
    
    // Test 1: Get teams
    console.log('\n📋 Testing: Get Teams');
    const teams = await client.teams();
    console.log(`✅ Found ${teams.nodes.length} teams:`);
    teams.nodes.forEach(team => {
      console.log(`   - ${team.name} (${team.key}) - ${team.id}`);
    });
    
    // Test 2: Get users
    console.log('\n👥 Testing: Get Users');
    const users = await client.users();
    console.log(`✅ Found ${users.nodes.length} users:`);
    users.nodes.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.id}`);
    });
    
    // Test 3: Get issues from Testing team
    console.log('\n🎯 Testing: Get Issues from Testing Team');
    const testingTeam = teams.nodes.find(team => team.name === 'Testing');
    if (testingTeam) {
      const issues = await client.issues({
        filter: {
          team: { id: { eq: testingTeam.id } }
        },
        first: 5
      });
      console.log(`✅ Found ${issues.nodes.length} issues in Testing team:`);
      issues.nodes.forEach(issue => {
        console.log(`   - ${issue.identifier}: ${issue.title}`);
      });
    }
    
    // Test 4: Create a test issue
    console.log('\n🚀 Testing: Create Test Issue');
    if (testingTeam) {
      try {
        const newIssue = await client.createIssue({
          teamId: testingTeam.id,
          title: 'Linear MCP Connection Test Issue - Cipher Agent002',
          description: `This is a test issue created via Linear MCP to verify the connection is working properly.

**Test Details:**
- Created by: Cipher Agent002 MCP
- Purpose: Verify Linear MCP integration
- Status: Testing connection functionality
- Date: ${new Date().toISOString()}

**Expected Outcome:**
This issue should appear in the Linear Testing team to confirm the MCP server can successfully create issues.

**MCP Status:** ✅ Linear MCP connection verified and working!`
        });
        
        console.log(`✅ Successfully created issue: ${newIssue.issue.identifier}`);
        console.log(`   Title: ${newIssue.issue.title}`);
        console.log(`   URL: ${newIssue.issue.url}`);
        
      } catch (error) {
        console.log(`❌ Failed to create issue: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Linear MCP Connection Test Complete!');
    
  } catch (error) {
    console.error('❌ Error testing Linear connection:', error.message);
  }
}

// Run the test
testLinearConnection().catch(console.error);
