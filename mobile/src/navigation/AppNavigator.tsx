import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import LoginScreen from '../screens/auth/LoginScreen';
import BusinessHomeScreen from '../screens/business/BusinessHomeScreen';
import CustomerListScreen from '../screens/business/CustomerListScreen';
import NewOrderScreen from '../screens/business/NewOrderScreen';
import ScheduleScreen from '../screens/business/ScheduleScreen';
import ConsignmentOutScreen from '../screens/business/ConsignmentOutScreen';
import TaskCenterScreen from '../screens/business/TaskCenterScreen';
import OCRCameraScreen from '../screens/ocr/OCRCameraScreen';
import VisitRecordScreen from '../screens/visit/VisitRecordScreen';
import TeamMapScreen from '../screens/manager/TeamMapScreen';
import PendingApprovalsScreen from '../screens/manager/PendingApprovalsScreen';
import TeamKPIScreen from '../screens/manager/TeamKPIScreen';
import RiskAlertsScreen from '../screens/manager/RiskAlertsScreen';
import KeyApprovalsScreen from '../screens/ceo/KeyApprovalsScreen';
import RiskSummaryScreen from '../screens/ceo/RiskSummaryScreen';
import ExecutiveKPIScreen from '../screens/ceo/ExecutiveKPIScreen';
import WarehouseHomeScreen from '../screens/warehouse/WarehouseHomeScreen';
import ReceivingScreen from '../screens/warehouse/ReceivingScreen';
import PickingScreen from '../screens/warehouse/PickingScreen';
import InventoryCountScreen from '../screens/warehouse/InventoryCountScreen';
import DeviceBindingScreen from '../screens/common/DeviceBindingScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function BusinessTabs() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#3b82f6',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e7eb', paddingBottom: 5, paddingTop: 5 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
    }}>
      <Tab.Screen name="Home" component={BusinessHomeScreen} options={{ tabBarLabel: '首页', tabBarIcon: () => <Text>🏠</Text> }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarLabel: '行程', tabBarIcon: () => <Text>📅</Text> }} />
      <Tab.Screen name="Customers" component={CustomerListScreen} options={{ tabBarLabel: '客户', tabBarIcon: () => <Text>👥</Text> }} />
      <Tab.Screen name="NewOrder" component={NewOrderScreen} options={{ tabBarLabel: '订单', tabBarIcon: () => <Text>📋</Text> }} />
      <Tab.Screen name="VisitRecord" component={VisitRecordScreen} options={{ tabBarLabel: '拜访', tabBarIcon: () => <Text>📝</Text> }} />
    </Tab.Navigator>
  );
}

function ManagerTabs() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#f59e0b',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e7eb', paddingBottom: 5, paddingTop: 5 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
    }}>
      <Tab.Screen name="TeamMap" component={TeamMapScreen} options={{ tabBarLabel: '地图', tabBarIcon: () => <Text>🗺️</Text> }} />
      <Tab.Screen name="Approvals" component={PendingApprovalsScreen} options={{ tabBarLabel: '审批', tabBarIcon: () => <Text>✅</Text> }} />
      <Tab.Screen name="TeamKPI" component={TeamKPIScreen} options={{ tabBarLabel: 'KPI', tabBarIcon: () => <Text>📊</Text> }} />
      <Tab.Screen name="RiskAlerts" component={RiskAlertsScreen} options={{ tabBarLabel: '预警', tabBarIcon: () => <Text>⚠️</Text> }} />
    </Tab.Navigator>
  );
}

function CEOTabs() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#8b5cf6',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e7eb', paddingBottom: 5, paddingTop: 5 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
    }}>
      <Tab.Screen name="Dashboard" component={ExecutiveKPIScreen} options={{ tabBarLabel: '看板', tabBarIcon: () => <Text>📈</Text> }} />
      <Tab.Screen name="KeyApprovals" component={KeyApprovalsScreen} options={{ tabBarLabel: '审批', tabBarIcon: () => <Text>🔐</Text> }} />
      <Tab.Screen name="Risk" component={RiskSummaryScreen} options={{ tabBarLabel: '风险', tabBarIcon: () => <Text>🔍</Text> }} />
    </Tab.Navigator>
  );
}

function WarehouseTabs() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#16a34a',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e7eb', paddingBottom: 5, paddingTop: 5 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
    }}>
      <Tab.Screen name="WHome" component={WarehouseHomeScreen} options={{ tabBarLabel: '首页', tabBarIcon: () => <Text>🏭</Text> }} />
      <Tab.Screen name="Receiving" component={ReceivingScreen} options={{ tabBarLabel: '收货', tabBarIcon: () => <Text>📥</Text> }} />
      <Tab.Screen name="Picking" component={PickingScreen} options={{ tabBarLabel: '拣货', tabBarIcon: () => <Text>📦</Text> }} />
      <Tab.Screen name="Count" component={InventoryCountScreen} options={{ tabBarLabel: '盘点', tabBarIcon: () => <Text>📋</Text> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Business" component={BusinessTabs} />
        <Stack.Screen name="Manager" component={ManagerTabs} />
        <Stack.Screen name="CEO" component={CEOTabs} />
        <Stack.Screen name="Warehouse" component={WarehouseTabs} />
        <Stack.Screen name="ConsignmentOut" component={ConsignmentOutScreen} />
        <Stack.Screen name="TaskCenter" component={TaskCenterScreen} />
        <Stack.Screen name="OCR" component={OCRCameraScreen} />
        <Stack.Screen name="DeviceBinding" component={DeviceBindingScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}